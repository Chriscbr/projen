import { LogLevel } from '../../logger';
import { PythonProject, PythonProjectOptions } from '../../python';
import { mkdtemp, synthSnapshot } from '../util';

test('poetry enabled', () => {
  const p = new TestPythonProject({
    poetry: true,
    authorEmail: 'foo@example.com',
    authorName: 'Firstname Lastname',
    homepage: 'http://www.example.com',
    description: 'a short project description',
    license: 'Apache Software License',
  });

  expect(synthSnapshot(p)).toMatchSnapshot();
});

class TestPythonProject extends PythonProject {
  constructor(options: Partial<PythonProjectOptions> = { }) {
    super({
      ...options,
      clobber: false,
      name: 'test-python-project',
      pythonPath: '/usr/bin/python',
      outdir: mkdtemp(),
      logging: { level: LogLevel.OFF },
      jsiiFqn: 'projen.python.PythonProject',
    });
  }
}