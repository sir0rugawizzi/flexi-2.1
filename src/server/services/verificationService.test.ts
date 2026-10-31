import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptBuffer, decryptToBuffer } from './cryptoService';
import { runAutomatedCoachVerification } from './verificationService';

test('encryptBuffer and decryptToBuffer perform authenticated AES-256-GCM roundtrip', () => {
  const secretNote = 'Client medical clearance and coach national ID';
  const encrypted = encryptBuffer(secretNote);

  assert.strictEqual(encrypted.algorithm, 'aes-256-gcm');
  assert.ok(encrypted.iv);
  assert.ok(encrypted.authTag);
  assert.ok(encrypted.encryptedData);
  assert.notStrictEqual(encrypted.encryptedData, secretNote);

  const decrypted = decryptToBuffer(encrypted);
  assert.strictEqual(decrypted.toString('utf-8'), secretNote);
});

test('runAutomatedCoachVerification validates documents and issues OTP', async () => {
  const verification = await runAutomatedCoachVerification({
    coachName: 'Kimbugwe Denis',
    phone: '+256702998877',
    headshotFilename: 'denis_headshot.jpg',
    headshotBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    licenceDocumentFilename: 'uoc_licence.pdf',
    licenceDocumentBase64: 'data:application/pdf;base64,JVBERi0xLjQK...',
    licenceNumber: 'UOC-FT-2025-091',
    issuingAuthority: 'Uganda Olympic Committee & National Fitness Accreditation Board',
  });

  assert.strictEqual(verification.isApproved, true);
  assert.ok(verification.verificationScore >= 80);
  assert.strictEqual(verification.licenceVerified, true);
  assert.strictEqual(verification.facialBiometricMatch, true);
  assert.ok(verification.accreditationId.startsWith('UG-CPT-'));
  assert.strictEqual(verification.otpCode.length, 6);
  assert.ok(verification.otpExpiresAt);
  assert.strictEqual(verification.phoneDispatchedTo, '+256702998877');
});

test('runAutomatedCoachVerification throws if mandatory photo or licence is missing', async () => {
  await assert.rejects(
    async () => {
      await runAutomatedCoachVerification({
        coachName: 'Namaganda Prossy',
        phone: '+256772111222',
        headshotFilename: '',
        licenceDocumentFilename: 'licence.pdf',
        licenceDocumentBase64: 'data:application/pdf;base64,...',
      });
    },
    { message: /Mandatory coach headshot photo is missing/ }
  );

  await assert.rejects(
    async () => {
      await runAutomatedCoachVerification({
        coachName: 'Namaganda Prossy',
        phone: '+256772111222',
        headshotFilename: 'photo.jpg',
        headshotBase64: 'data:image/jpeg;base64,...',
        licenceDocumentFilename: '',
      });
    },
    { message: /Mandatory professional fitness coaching licence/ }
  );
});
