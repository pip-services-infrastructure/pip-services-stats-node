let _ = require('lodash');
let async = require('async');
let moment = require('moment-timezone');

import { FilterParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';
import { DataPage } from 'pip-services-commons-node';
import { IdentifiableMongoDbPersistence } from 'pip-services-data-node';

import { StatCounterTypeV1 } from '../data/version1/StatCounterTypeV1';
import { StatCounterRecordV1 } from '../data/version1/StatCounterRecordV1';
import { StatCounterIncrementV1 } from '../data/version1/StatCounterIncrementV1';
import { IStatisticsPersistence } from './IStatisticsPersistence';
import { StatRecordsMongoDbSchema } from './StatRecordsMongoDbSchema';
import { StatCounterKeyGenerator } from './StatCounterKeyGenerator';

export class StatisticsMongoDbPersistence 
    extends IdentifiableMongoDbPersistence<StatCounterRecordV1, string> 
    implements IStatisticsPersistence {

    constructor() {
        super('statistics', StatRecordsMongoDbSchema());
        this._maxPageSize = 1000;
    }

    public getGroups(correlationId: string, paging: PagingParams,
        callback: (err: any, page: DataPage<string>) => void): void {
        
        // Extract a page
        paging = paging != null ? paging : new PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);

        let filter = { type: 0 };
        let options = { group: 1 };
        
        this._model.find(filter, options, (err, items) => {
            if (items != null) {
                items = _.map(items, (item) => item.group);
                items = _.uniq(items);
            
                let total = null;
                if (paging.total)
                    total = items.length;
                
                if (skip > 0)
                    items = _.slice(items, skip);
                items = _.take(items, take);
                        
                let page = new DataPage<string>(items, total);
                callback(null, page);
            } else {
                callback(err, null);
            }
        });
    }

    private composeFilter(filter: FilterParams): any {
        filter = filter || new FilterParams();

        let criteria = [];

        let search = filter.getAsNullableString('search');
        if (search != null) {
            let searchRegex = new RegExp(search, "i");
            let searchCriteria = [];
            searchCriteria.push({ group: { $regex: searchRegex } });
            searchCriteria.push({ name: { $regex: searchRegex } });
            criteria.push({ $or: searchCriteria });
        }

        let group = filter.getAsNullableString('group');
        if (group != null)
            criteria.push({ group: group });

        let name = filter.getAsNullableString('name');
        if (name != null)
            criteria.push({ name: name });

        let type = filter.getAsNullableInteger('type');
        if (type != null)
            criteria.push({ type: type });

        let timezone = filter.getAsNullableString('timezone');
        let fromTime = filter.getAsNullableDateTime('from_time');
        let fromId = fromTime != null ? StatCounterKeyGenerator.makeCounterKeyFromTime(group, name, type, fromTime, timezone) : null;
        if (fromId != null)
            criteria.push({ _id: { $gte: fromId } });

        let toTime = filter.getAsNullableDateTime('to_time');
        let toId = toTime != null ? StatCounterKeyGenerator.makeCounterKeyFromTime(group, name, type, toTime, timezone) : null;
        if (toId != null)
            criteria.push({ _id: { $lte: toId } });

        return criteria.length > 0 ? { $and: criteria } : {};
    }

    public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, callback: any) {
        super.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
    }

    public getListByFilter(correlationId: string, filter: FilterParams, callback: any) {
        super.getListByFilter(correlationId, this.composeFilter(filter), null, null, callback);
    }

    private addPartialIncrement(batch: any, group: string, name: string, type: StatCounterTypeV1,
        momentTime: any, value: number) {
        
        let id = StatCounterKeyGenerator.makeCounterKeyFromMoment(group, name, type, momentTime);

        let data: any = {
            group: group,
            name: name,
            type: type
        };
        
        if (type != StatCounterTypeV1.Total) {
            data.year = momentTime.year();
            if (type != StatCounterTypeV1.Year) {
                data.month = momentTime.month();
                if (type != StatCounterTypeV1.Month) {
                    data.day = momentTime.day();
                    if (type != StatCounterTypeV1.Day) {
                        data.hour = momentTime.hour();
                    }
                }
            }
        }

        batch
            .find({
                _id: id
            })
            .upsert()
            .updateOne({
                $set: data,
                $inc: {
                    value: value
                }
            });
    }

    private addOneIncrement(batch: any, group: string, name: string,
        time: Date, timezone: string, value: number) {

        let tz = timezone || 'UTC';
        let momentTime =  moment(time).tz(tz);

        this.addPartialIncrement(batch, group, name, StatCounterTypeV1.Total, momentTime, value);
        this.addPartialIncrement(batch, group, name, StatCounterTypeV1.Year, momentTime, value);
        this.addPartialIncrement(batch, group, name, StatCounterTypeV1.Month, momentTime, value);
        this.addPartialIncrement(batch, group, name, StatCounterTypeV1.Day, momentTime, value);
        this.addPartialIncrement(batch, group, name, StatCounterTypeV1.Hour, momentTime, value);
    }
    
    public incrementOne(correlationId: string, group: string, name: string,
        time: Date, timezone: string, value: number,
        callback?: (err: any, added: boolean) => void): void {

        let batch = this._model.collection.initializeUnorderedBulkOp();
        this.addOneIncrement(batch, group, name, time, timezone, value);

        batch.execute((err) => {
            if (err == null)
                this._logger.trace(correlationId, "Incremented %s.%s", group, name);
         
            if (callback) callback(null, err == null);
        });
    }

    public incrementBatch(correlationId: string, increments: StatCounterIncrementV1[],
        callback?: (err: any) => void): void {

        if (increments == null || increments.length == 0) {
            if (callback) callback(null);
            return;
        }

        let batch = this._model.collection.initializeUnorderedBulkOp();

        for (let increment of increments) {
            this.addOneIncrement(batch,
                increment.group, increment.name, increment.time,
                increment.timezone, increment.value);
        }

        batch.execute((err) => {
            if (err == null)
                this._logger.trace(correlationId, "Incremented %d counters", increments.length);
            
            if (callback) callback(null);
        });
    }
}
