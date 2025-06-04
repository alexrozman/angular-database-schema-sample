import { TestBed } from '@angular/core/testing';
import { DatabaseService, Table } from './database.service';
import { LogService } from './log.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let logSpy: jasmine.SpyObj<LogService>;

  beforeEach(() => {
    logSpy = jasmine.createSpyObj('LogService', ['debug', 'info', 'warn', 'error', 'catch', 'handle']);
    TestBed.configureTestingModule({
      providers: [
        DatabaseService,
        { provide: LogService, useValue: logSpy }
      ]
    });
    service = TestBed.inject(DatabaseService);
  });

  it('getOrMakeTable returns an existing table if present', () => {
    const existing: Table = { tableName: 'users', columns: [] };
    service.tables.push(existing);

    const result = service.getOrMakeTable('users');
    expect(result).toBe(existing);
    expect(service.tables.length).toBe(1);
  });

  it('getOrMakeTable creates and stores a new table with empty columns when absent', () => {
    const result = service.getOrMakeTable('orders');

    expect(result.tableName).toBe('orders');
    expect(result.columns).toEqual([]);
    expect(service.tables.length).toBe(1);
    expect(service.tables[0]).toBe(result);
  });
});
