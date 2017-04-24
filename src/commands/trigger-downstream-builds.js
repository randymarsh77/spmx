//
// trigger-downstream-builds
//
// a push to the build repo triggers build which executes this command
// as part of the push to the build repo (from a build script),
//   update a CI variable to track which upstream projects to trigger
//
// for-each upstream in queue
//   get file at {upstream}.json; bail if none
//   for-each downstream
//     trigger {downstream}
//
// reset queue
//
