export const canEnterProject = (signedIn: boolean, cloudReady: boolean, syncState: string) =>
  signedIn && cloudReady && syncState !== 'upgrade'
