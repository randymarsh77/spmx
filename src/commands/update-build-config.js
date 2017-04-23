
export default function updateBuildConfig()
{
	console.log('update test');
}

//
// update build config
//
// parse package.swift
// get upstream repos and versions (for packages wth allowable source prefix)
// clone build repo, or get or create each file at /{repo}/{upstream}.json via api, ideally
// update to {
//   repo: {upstream},
//   ...,
//   downstream: [
//	   { repo: {self} }
//   ],
// }
//
// push to build repo, or use api
//
