# Wafrn - Angular

This package is the frontend of Wafrn.

The frontend of Wafrn uses [Angular](https://angular.io/). Have fun doing stuff ;D

- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Local Development](#local-development)
- [Contributing](#contributing)
- [License](#license)

## Installation

<details>

### Prerequisites

This project uses NPM. You can check that NPM is installed in the terminal by running:

```bash
npm -v
```

### Setup

First, [fork the repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).

Once the prerequisites are installed, and you are working off the fork, [clone the repository](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)
to your local machine.

This can be done from the command line:

```bash
git clone git@github.com:[YOUR USERNAME HERE]/wafrn.git ./wafrn
```

### Local Development

You can run the development server through the command line:

```bash
npm run frontend:develop      # Point to local backend
npm run frontend:develop:prod # Point to production backend
```

If you have Nix installed, you can also run the development environment through the provided `shell.nix` file which includes Node 20.

```bash
nix-shell

# Now in nix shell with Node 20 installed
```

To run the frontend pointing to the production server and immediately exit upon the command's completion, you can run:

```bash
nix-shell --command "trap 'exit' INT;npm run frontend:develop:prod"
```

In either case, when the server is set up, you should get a success message:

```text
Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/
  ➜  press h + enter to show help
```

</details>

## Contributing

Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change.

Merge pull requests to the `main` branch.

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
