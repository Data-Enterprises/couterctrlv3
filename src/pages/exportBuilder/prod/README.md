# exportBuilder — prod tree (empty)

This is a Coming Soon page: it is dev only. Its UI lives in `../dev/`, it
renders only on the dev API, and on the prod API (what clients see) the
switcher shows DevOnlyNotice instead.

Its slice is dev-only too — `state.dev.exportBuilder` with no prod twin —
which is why `sliceIsolation.test.ts` carries it in `DEV_ONLY_SLICES`.

This folder stays empty until the page is greenlit for production. Then the
dev tree is copied here and set up for prod, the switcher is changed to pick
a tree like every other split page, the slice gains its prod counterpart, and
this README goes.
