import * as OTPAuth from 'otpauth'

export default async function verifyTotp(mfaDetail: any, token: string) {
  if (mfaDetail.type == "totp") {
    const totp = new OTPAuth.TOTP({
      algorithm: mfaDetail.data.algorithm,
      digits: mfaDetail.data.digits,
      period: mfaDetail.data.period,
      secret: OTPAuth.Secret.fromBase32(mfaDetail.data.secret)
    });

    // check when the last OTP code was used. If recently we'll invalidate it, and you'll need to wait another 30 seconds
    const counter = totp.counter();
    if (mfaDetail.lastUsedData?.counter >= counter) {
      return false;
    }

    // otherwise we'll check if the token you provided is correct
    const delta = totp.validate({ token: token, window: 1 })
    if (delta !== null) {
      // update the MFA details to store the current counter value
      mfaDetail.lastUsedData = {
        counter: totp.counter()
      }
      await mfaDetail.save()

      // and we're in
      return true;
    }
  }
  return false;
}
