import { registerPlugin } from '@capacitor/core';

// Registers the native iOS implementation (CAPPlugin named "EqhoAudio").
// On web / non-native platforms this resolves to a no-op proxy; callers must
// gate real usage behind Capacitor.isNativePlatform().
export const EqhoAudio = registerPlugin('EqhoAudio');
