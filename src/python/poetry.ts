import { Component } from '../component';
import { DependencyType } from '../deps';
import { Task, TaskCategory } from '../tasks';
import { TomlFile } from '../toml';
import { exec, execOrUndefined } from '../util';
import { IPythonDeps } from './python-deps';
import { IPythonEnv } from './python-env';
import { IPythonPackaging } from './python-packaging';
import { PythonProject } from './python-project';

export interface PoetryOptions {}

/**
 * Manage project dependencies, virtual environments, and packaging through the
 * poetry CLI tool.
 */
export class Poetry extends Component implements IPythonDeps, IPythonEnv, IPythonPackaging {
  private readonly pythonProject: PythonProject;
  public readonly installTask: Task;

  constructor(project: PythonProject, _options: PoetryOptions) {
    super(project);

    this.pythonProject = project;

    this.installTask = project.addTask('install', {
      description: 'Install and upgrade dependencies',
      category: TaskCategory.BUILD,
      exec: 'poetry install',
    });
  }

  /**
   * Adds a runtime dependency.
   *
   * @param spec Format `<module>@<semver>`
   */
  public addDependency(spec: string) {
    this.project.deps.addDependency(spec, DependencyType.RUNTIME);
  }

  /**
   * Adds a dev dependency.
   *
   * @param spec Format `<module>@<semver>`
   */
  public addDevDependency(spec: string) {
    this.project.deps.addDependency(spec, DependencyType.DEVENV);
  }

  /**
   * Initializes the virtual environment if it doesn't exist (called during post-synthesis).
   */
  public setupEnvironment() {
    const result = execOrUndefined('which poetry', { cwd: this.project.outdir });
    if (!result) {
      this.project.logger.info('Unable to setup an environment since poetry is not installed. Please install poetry (https://python-poetry.org/docs/) or use a different component for managing environments such as \'venv\'.');
    }

    let envPath = execOrUndefined('poetry env info -p', { cwd: this.project.outdir });
    if (!envPath) {
      this.project.logger.info(`Setting up a virtual environment using the python installation that was found: ${this.pythonProject.pythonPath}.`);
      exec(`poetry env use ${this.pythonProject.pythonPath}`, { cwd: this.project.outdir });
      envPath = execOrUndefined('poetry env info -p', { cwd: this.project.outdir });
      this.project.logger.info(`Environment successfully created (located in ${envPath}}).`);
    }
  }

  /**
   * Installs dependencies (called during post-synthesis).
   */
  public installDependencies() {
    this.project.logger.info('Installing dependencies...');
    exec(this.installTask.toShellCommand(), { cwd: this.project.outdir });
  }
}


export interface PoetryPyprojectOptions {
  /**
   * Name of the package.
   */
  readonly name: string;

  /**
   * Version of the package.
   */
  readonly version: string;

  /**
   * A short description of the package.
   */
  readonly description: string;

  /**
   * License of this package as an SPDX identifier.
   *
   * If the project is proprietary and does not use a specific license, you
   * can set this value as "Proprietary".
   */
  readonly license?: string;

  /**
   * The authors of the package. Must be in the form "name <email>"
   */
  readonly authors?: string[];

  /**
   * the maintainers of the package. Must be in the form "name <email>"
   */
  readonly maintainers?: string[];

  /**
   * The name of the readme file of the package.
   */
  readonly readme?: string;

  /**
   * A URL to the website of the project.
   */
  readonly homepage?: string;

  /**
   * A URL to the repository of the project.
   */
  readonly repository?: string;

  /**
   * A URL to the documentation of the project.
   */
  readonly documentation?: string;

  /**
   * A list of keywords (max: 5) that the package is related to.
   */
  readonly keywords?: string[];

  /**
   * A list of PyPI trove classifiers that describe the project.
   *
   * @see https://pypi.org/classifiers/
   */
  readonly classifiers?: string[];

  /**
   * A list of packages and modules to include in the final distribution.
   */
  readonly packages?: string[];

  /**
   * A list of patterns that will be included in the final package.
   */
  readonly include?: string[];

  /**
   * A list of patterns that will be excluded in the final package.
   *
   * If a VCS is being used for a package, the exclude field will be seeded with
   * the VCS’ ignore settings (.gitignore for git for example).
   */
  readonly exclude?: string[];

  /**
   * A list of dependencies for the project.
   *
   * The python version for which your package is compatible is also required.
   *
   * @example { requests: "^2.13.0" }
   */
  readonly dependencies: { [key: string]: string };

  /**
   * A list of development dependencies for the project.
   *
   * @example { requests: "^2.13.0" }
   */
  readonly devDependencies: { [key: string]: string };

  /**
   * The scripts or executables that will be installed when installing the package.
   */
  readonly scripts: { [key: string]: string };
}

/**
 * Represents configuration of a pyproject.toml file for a Poetry project.
 *
 * @see https://python-poetry.org/docs/pyproject/
 */
export class PoetryPyproject extends Component {
  public readonly file: TomlFile;

  constructor(project: PythonProject, options: PoetryPyprojectOptions) {
    super(project);

    this.file = new TomlFile(project, 'pyproject.toml', {
      marker: true,
      omitEmpty: true,
      obj: {
        'build-system': {
          'requires': ['poetry_core>=1.0.0'],
          'build-backend': 'poetry.core.masonry.api',
        },
        'tool.poetry': {
          name: options.name,
          version: options.version,
          description: options.description,
          license: options.license,
          authors: options.authors,
          maintainers: options.maintainers,
          readme: options.readme,
          homepage: options.homepage,
          repository: options.repository,
          documentation: options.documentation,
          keywords: options.keywords,
          classifiers: options.classifiers,
          packages: options.packages,
          include: options.include,
          exclude: options.exclude,
        },
        'tool.poetry.dependencies': options.dependencies,
        'tool.poetry.dev-dependencies': options.devDependencies,
        'tool.poetry.scripts': options.scripts,
      },
    });
  }
}