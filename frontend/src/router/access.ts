export const canEnterProject = (signedIn: boolean, cloudReady: boolean, syncState: string) =>
  signedIn && cloudReady && syncState !== 'upgrade'

export const confirmFinalSave = async (endingUnlocked: boolean, account: {
  syncState: string; pendingUpload: boolean; saveNow: () => Promise<boolean>
}) => {
  if (!endingUnlocked) return false
  if (account.syncState !== 'synced' || account.pendingUpload) await account.saveNow()
  return account.syncState === 'synced' && !account.pendingUpload
}
