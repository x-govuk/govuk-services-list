# GOV.UK frontend toolkit npm package

This is an npm package for [the GOV.UK frontend toolkit][toolkit].
It bundles up the toolkit and publishes [govuk_frontend_toolkit on the npmjs registry][npmjs]
so that you can install it as a dependency in your JavaScript application.

[toolkit]: https://github.com/alphagov/govuk_frontend_toolkit
[npmjs]: https://www.npmjs.org/package/govuk_frontend_toolkit

## Installing

To include the toolkit in your project run:

```
npm install --save govuk_frontend_toolkit
```

This will install the toolkit inside your node_modules and will add the package to you package.json.

## Updating this package

This package is updated automatically by a job on a GDS continuous integration (CI) server whenever
the `VERSION.txt` file in the toolkit changes.

The CI server is configured to authenticate with npm using an `.npmrc` file. The file is templated
in [ci-puppet][] and the credentials are passed in from [ci-deployment][].

[ci-puppet]: https://github.com/alphagov/ci-puppet
[ci-deployment]: https://github.gds/gds/ci-deployment

All development of the toolkit should happen [upstream][toolkit] and changes will then become
available in this package.

## Licence

[MIT License](LICENCE)
