# WARNING - gocd-cypress is deprecated and not receiving new features
This tool is no longer used by Adnouvm.

# gocd-cypress

This package supports running Cypress in GoCD by offering the following features:

- run testing in a Docker container when the `CI` environment flag is set
- optionally start the local development server of your application
- create a merged HTML report


# Prerequisites

Please make sure to install Cypress before using gocd-cypress.

This tool has been tested for compatibility with the following ranges of Cypress versions:

| gocd-cypress | Cypress | Node.js |
|-----|----|----| 
| 3.0   | 10–12 | 16 |
| 2.2.2 | 5-10 | 16 |

# Installation

```bash
npm install -D github:adnovum/gocd-cypress#v3.0.0
```

# Execution

## Minimal example

*`package.json`*:

```json
{
    "scripts": {
        "test:e2e": "gocd-cypress",
        "test:e2eStandalone": "gocd-cypress --serveCmd='npm start' --serveHost=http://localhost:4200"
    }
}
```

## Help

For the command-line customization options please see:

```bash
npx gocd-cypress --help
```

# Configuration

This tool uses [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for the configuration options, see its
documentation about where you can define your options. The module name we use with it is `gocdCypress`.

Example in `package.json`:

```json
{
    "name": "my-project",
    "version": "0.0.0",
    "gocdCypress": {
        "cypressCmd": "cypress run --browser firefox",
        "dockerImage": "cypress/browsers:node16.13.0-chrome95-ff94"
    }
}
```

We also support profiles that can override any of the config values. Profiles can be selected with command-line
option `--profile [profile-name]`:

```json
{
    "gocdCypress": {
        "cypressCmd": "cypress run --browser electron",
        "profiles": {
             "browserChrome": {
                "cypressCmd": "cypress run --browser chrome"
             },
             "browserFirefox": {
                "cypressCmd": "cypress run --browser firefox"
             }
        }
    }
}
```

Environment variables can override Cosmiconfig options. Each option is mapped to an environment variable with its name
converted to underscore case and prefixed with `CY_`. For example:

```bash
export CY_DOCKER_IMAGE=cypress/browsers:node16.13.0-chrome95-ff94
export CY_CYPRESS_CMD='cypress run --browser firefox'
npx gocd-cypress
```

Command-line options have the highest precedence over other means of configuration.

## Configuration keys

### Command-line options

All command-line options are also available as Cosmiconfig options.

### `projectPath`

*default:* `process.cwd()`

Root path of project.

### `dockerImage`

*default:* `'cypress/browsers:node16.13.0-chrome95-ff94'`

Docker image name and tag that is used when testing is run in container mode.

### `bootstrapCmd`

*default:* `'true'`

Optional command that is invoked in container mode, before testing.

## CI/CD integration

gocd-cyress recognizes `CI` environment variable. If its value is `1` or `true` then the tool will use docker mode automatically.

# Contribution

## Release

After having stable version on master, one just need to create a new tag that will act as a version.
