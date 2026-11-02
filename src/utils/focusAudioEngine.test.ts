import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOUNDSCAPE_TRACKS,
  focusAudio,
  SoundscapeId,
} from './focusAudioEngine';

test('SOUNDSCAPE_TRACKS contains required Ugandan Baximba and Lo-Fi soundscapes', () => {
  assert.ok(SOUNDSCAPE_TRACKS.uganda_baximba);
  assert.ok(SOUNDSCAPE_TRACKS.lofi_kampala);
  assert.ok(SOUNDSCAPE_TRACKS.nile_ambient);

  assert.equal(SOUNDSCAPE_TRACKS.uganda_baximba.title, 'Baximba & Kadodi Groove');
  assert.equal(SOUNDSCAPE_TRACKS.uganda_baximba.bpm, 128);
  assert.equal(SOUNDSCAPE_TRACKS.lofi_kampala.title, 'Kampala Rain & Lo-Fi Chill');
  assert.equal(SOUNDSCAPE_TRACKS.lofi_kampala.bpm, 82);
  assert.equal(SOUNDSCAPE_TRACKS.nile_ambient.bpm, 60);
});

test('focusAudio getTrack returns correct metadata', () => {
  const track = focusAudio.getTrack('uganda_baximba');
  assert.equal(track.bpm, 128);
  assert.equal(track.genre, 'Traditional Tribal Fusion');
});

test('focusAudio manages volume state within 0 to 1 boundaries', () => {
  focusAudio.setVolume(0.8);
  assert.equal(focusAudio.getState().volume, 0.8);

  // Over max
  focusAudio.setVolume(1.5);
  assert.equal(focusAudio.getState().volume, 1.0);

  // Under min
  focusAudio.setVolume(-0.5);
  assert.equal(focusAudio.getState().volume, 0.0);
});

test('focusAudio manages mute toggle state', () => {
  const initialMute = focusAudio.getState().isMuted;
  const toggled = focusAudio.toggleMute();
  assert.equal(toggled, !initialMute);
  assert.equal(focusAudio.getState().isMuted, !initialMute);
  // Toggle back
  focusAudio.toggleMute();
  assert.equal(focusAudio.getState().isMuted, initialMute);
});

test('focusAudio beat callback subscription and unsubscription works cleanly', () => {
  let beatCount = 0;
  const unsubscribe = focusAudio.onBeat((beat, bpm) => {
    beatCount++;
  });

  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
});
