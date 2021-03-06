let _ = require('lodash');
let async = require('async');
let assert = require('chai').assert;

import { Descriptor } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DateTimeConverter } from 'pip-services3-commons-node';
import { References } from 'pip-services3-commons-node';
import { ConsoleLogger } from 'pip-services3-components-node';

import { StatCounterV1 } from '../../src/data/version1/StatCounterV1';
import { StatCounterIncrementV1 } from '../../src/data/version1/StatCounterIncrementV1';
import { StatCounterValueSetV1 } from '../../src/data/version1/StatCounterValueSetV1';
import { StatCounterTypeV1 } from '../../src/data/version1/StatCounterTypeV1';
import { StatisticsMemoryPersistence } from '../../src/persistence/StatisticsMemoryPersistence';
import { StatisticsController } from '../../src/logic/StatisticsController';

suite('StatisticsController', ()=> {
    let persistence: StatisticsMemoryPersistence;
    let controller: StatisticsController;

    suiteSetup(() => {
        persistence = new StatisticsMemoryPersistence();
        controller = new StatisticsController();

        let logger = new ConsoleLogger();

        let references: References = References.fromTuples(
            new Descriptor('pip-services', 'logger', 'console', 'default', '1.0'), logger,
            new Descriptor('pip-services-statistics', 'persistence', 'memory', 'default', '1.0'), persistence,
            new Descriptor('pip-services-statistics', 'controller', 'default', 'default', '1.0'), controller
        );

        controller.setReferences(references);
    });
    
    setup((done) => {
        persistence.clear(null, done);
    });
    
    test('CRUD Operations', (done) => {
        async.series([
        // Increment counter
            (callback) => {
                controller.incrementCounter(
                    null,
                    'test', 'value1', DateTimeConverter.toDateTime('1975-04-09T19:00:00.00Z'), 'UTC', 1,
                    (err) => {
                        assert.isNull(err);

                        callback();
                    }
                );
            },
        // Increment the same counter again
            (callback) => {
                controller.incrementCounters(
                    null,
                    [ 
                        <StatCounterIncrementV1>{ 
                            group: 'test',
                            name: 'value1',
                            time: DateTimeConverter.toDateTime('1975-04-09T20:00:00.00Z'),
                            timezone: 'UTC',
                            value: 2
                        }
                    ],
                    (err) => {
                        assert.isNull(err);

                        callback();
                    }
                );
            },
        // Check all counters
            (callback) => {
                controller.getCounters(
                    null,
                    null,
                    new PagingParams(),
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 1);

                        callback();
                    }
                );
            },
        // Check all counters
            (callback) => {
                controller.getGroups(
                    null,
                    new PagingParams(),
                    (err, page) => {
                        assert.isNull(err);

                        assert.isObject(page);
                        assert.lengthOf(page.data, 1);

                        callback();
                    }
                );
            },
        // Check total counters
            (callback) => {
                controller.readOneCounter(
                    null, 'test', 'value1', StatCounterTypeV1.Total, null, null, null,
                    (err, set) => {
                        assert.isNull(err);

                        assert.isObject(set);
                        assert.lengthOf(set.values, 1);

                        let record = set.values[0];
                        assert.equal(3, record.value);

                        callback();
                    }
                );
            },
        // Check total counters by group
            (callback) => {
                controller.readCountersByGroup(
                    null, 'test', StatCounterTypeV1.Total, null, null, null,
                    (err, sets) => {
                        assert.isNull(err);

                        assert.isArray(sets);
                        assert.lengthOf(sets, 1);
                        
                        let set = sets[0];
                        assert.lengthOf(set.values, 1);

                        let record = set.values[0];
                        assert.equal(3, record.value);

                        callback();
                    }
                );
            },
        // Check monthly counters
            (callback) => {
                controller.readCounters(
                    null, 
                    [ new StatCounterV1('test', 'value1') ],
                    StatCounterTypeV1.Hour,
                    DateTimeConverter.toDateTime('1975-04-09T19:00:00.00Z'),
                    DateTimeConverter.toDateTime('1975-04-09T19:00:00.00Z'),
                    'UTC',                    
                    (err, sets) => {
                        assert.isNull(err);

                        assert.lengthOf(sets, 1);

                        let set = sets[0];
                        assert.isObject(set);
                        assert.lengthOf(set.values, 1);

                        let record = set.values[0];
                        assert.equal(1, record.value);

                        callback();
                    }
                );
            }
        ], done);
    });
});