import { Component } from '../component';
import { Task, TaskCategory } from '../tasks';
import { PythonProject } from './python-project';
import { SetupPy, SetupPyOptions } from './setuppy';

export interface SetuptoolsOptions extends SetupPyOptions {}

export class Setuptools extends Component {
  public readonly packageTask: Task;
  public readonly uploadTask: Task;
  constructor(project: PythonProject, options: SetuptoolsOptions) {
    super(project);

    project.addDevDependency('wheel@0.36.2');
    project.addDevDependency('twine@3.3.0');

    this.packageTask = project.addTask('package', {
      description: 'Creates source archive and wheel for distribution.',
      category: TaskCategory.RELEASE,
      exec: 'rm -fr dist/* && python setup.py sdist bdist_wheel',
    });

    this.uploadTask = project.addTask('upload:test', {
      description: 'Uploads the package against a test PyPI endpoint.',
      category: TaskCategory.RELEASE,
      exec: 'twine upload --repository-url https://test.pypi.org/legacy/ dist/*',
    });

    new SetupPy(project, options);
  }
}