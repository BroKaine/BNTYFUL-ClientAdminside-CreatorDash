# Third-party notices

## SheetJS Community Edition

- Version: `0.20.3`
- Project: <https://sheetjs.com/>
- Distribution source: `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js`
- Local artifact: `public/vendor/sheetjs/xlsx.full.min.js`
- SHA-256: `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`
- License artifact: `public/vendor/sheetjs/LICENSE`
- License SHA-256: `4d2a38ac35cda06a555c84074a819d413339cd3691b822cae50f8f322fe01f64`

The official browser artifact is vendored because the SheetJS project recommends vendoring standalone browser scripts. It is loaded locally and only inside the spreadsheet Web Worker.

Upgrade procedure:

1. Review the new SheetJS release notes and security guidance.
2. Download the official browser build and license directly from `cdn.sheetjs.com`.
3. Replace both local artifacts.
4. Update the version, source URL, and SHA-256 values in this file.
5. Run unit tests, the two canonical sample validations, end-to-end browser tests, production build, and dependency audit.
