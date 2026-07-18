import { registerPlugin } from '@capacitor/core';

import type { EqhoAudioPlugin } from './definitions';

// Registers the native iOS implementation (CAPPlugin with jsName "EqhoAudio").
// On web / non-native platforms this resolves to a no-op proxy; callers must
// gate real usage behind Capacitor.isNativePlatform().
//
// NOTE: the PUBLISHED entry point is the hand-written root `index.js` (this
// package is build-free). This file mirrors it as the readable TS source.
export const EqhoAudio = registerPlugin<EqhoAudioPlugin>('EqhoAudio');

export * from './definitions';
