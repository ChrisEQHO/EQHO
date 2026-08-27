import 'server-only'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

// Server-only R2 admin helpers. These use the same Vercel-provided R2 credentials
// as app/api/r2/route.ts but are meant for privileged, whole-account operations
// (e.g. deleting every object a user owns during account deletion). NEVER import
// this from client code — it would leak credentials into the bundle.

function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const accountId = process.env.R2_ACCOUNT_ID
  const bucketName = process.env.R2_BUCKET_NAME
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  return { accessKeyId, secretAccessKey, bucketName, endpoint }
}

function createR2Client(): { client: S3Client; bucket: string } | null {
  const { accessKeyId, secretAccessKey, bucketName, endpoint } = getR2Config()
  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    return null
  }
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
  return { client, bucket: bucketName }
}

export type DeleteUserObjectsResult = {
  ok: boolean
  deleted: number
  /** Present when R2 isn't configured or the purge failed partway. */
  error?: string
}

/**
 * Delete every R2 object owned by a user.
 *
 * All of a user's audio lives under the `users/{userId}/` key prefix (see
 * getTrackStorageKey in lib/r2-storage.ts), so we list that prefix page by page
 * and batch-delete up to 1000 keys per request. Returns a count and never throws
 * — account deletion should proceed even if storage cleanup is partial, with the
 * failure surfaced for logging.
 */
export async function deleteAllUserObjects(userId: string): Promise<DeleteUserObjectsResult> {
  if (!userId) return { ok: false, deleted: 0, error: 'Missing userId' }

  const r2 = createR2Client()
  if (!r2) {
    // R2 not configured in this environment — treat as nothing to delete.
    return { ok: false, deleted: 0, error: 'R2 not configured' }
  }

  const { client, bucket } = r2
  const prefix = `users/${userId}/`
  let deleted = 0
  let continuationToken: string | undefined

  try {
    do {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      )

      const objects = (listed.Contents || [])
        .map((o) => o.Key)
        .filter((k): k is string => !!k)
        // Defensive: never delete a key that isn't actually under this user's prefix.
        .filter((k) => k.startsWith(prefix))
        .map((Key) => ({ Key }))

      if (objects.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects, Quiet: true },
          }),
        )
        deleted += objects.length
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } while (continuationToken)

    return { ok: true, deleted }
  } catch (error) {
    console.error('[v0] deleteAllUserObjects failed:', error)
    return {
      ok: false,
      deleted,
      error: error instanceof Error ? error.message : 'Unknown R2 error',
    }
  }
}
