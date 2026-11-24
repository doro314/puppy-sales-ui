import { checkLitters, formatReport } from './checkLitters';
import data from './litters.json';
import schema from './litters.schema.json';

// The rest of the suite mocks the data; this is the test that reads the real file.
test('the real litters.json passes the checker', () => {
  const report = checkLitters(data, schema);
  expect(report.errors, formatReport(report)).toEqual([]);
});
