import { CommandSet } from 'pip-services-commons-node';
import { ICommand } from 'pip-services-commons-node';
import { Command } from 'pip-services-commons-node';
import { Schema } from 'pip-services-commons-node';
import { Parameters } from 'pip-services-commons-node';
import { FilterParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';
import { ObjectSchema } from 'pip-services-commons-node';
import { ArraySchema } from 'pip-services-commons-node';
import { TypeCode } from 'pip-services-commons-node';
import { FilterParamsSchema } from 'pip-services-commons-node';
import { PagingParamsSchema } from 'pip-services-commons-node';

import { StatCounterV1Schema } from '../data/version1/StatCounterV1Schema';
import { StatCounterV1 } from '../data/version1/StatCounterV1';
import { StatCounterSetV1 } from '../data/version1/StatCounterSetV1';
import { IStatisticsBusinessLogic } from './IStatisticsBusinessLogic';

export class StatisticsCommandSet extends CommandSet {
    private _logic: IStatisticsBusinessLogic;

	constructor(logic: IStatisticsBusinessLogic) {
		super();

		this._logic = logic;

		// Register commands to the database
		this.addCommand(this.makeGetContersCommand());
		this.addCommand(this.makeIncrementCounterCommand());
		this.addCommand(this.makeReadCountersCommand());
		this.addCommand(this.makeReadOneCounterCommand());
	}

	private makeGetContersCommand(): ICommand {
		return new Command(
			"get_counters",
			new ObjectSchema(true)
				.withOptionalProperty('filter', new FilterParamsSchema())
				.withOptionalProperty('paging', new PagingParamsSchema()),
			(correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
				let filter = FilterParams.fromValue(args.get("filter"));
				let paging = PagingParams.fromValue(args.get("paging"));
				this._logic.getCounters(correlationId, filter, paging, callback);
			}
		);
	}

	private makeIncrementCounterCommand(): ICommand {
		return new Command(
			"increment_counter",
			new ObjectSchema(true)
				.withRequiredProperty('group', TypeCode.String)
				.withRequiredProperty('name', TypeCode.String)
				.withOptionalProperty('time', null) //TypeCode.DateTime)
				.withRequiredProperty('value', null), //TypeCode.Double)
			(correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
				let group = args.getAsNullableString("group");
				let name = args.getAsNullableString("name");
				let time = args.getAsNullableDateTime("time");
				let value = args.getAsDouble("value");
				this._logic.incrementCounter(correlationId, group, name, time, value, (err) => {
					callback(err, null);
				});
			}
		);
	}

	private makeReadOneCounterCommand(): ICommand {
		return new Command(
			"read_one_counter",
			new ObjectSchema(true)
				.withRequiredProperty('group', TypeCode.String)
				.withRequiredProperty('name', TypeCode.String)
				.withRequiredProperty('type', TypeCode.Long)
				.withOptionalProperty('from_time', null) //TypeCode.DateTime)
				.withOptionalProperty('to_time', null), //TypeCode.DateTime)
			(correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
				let group = args.getAsNullableString("group");
				let name = args.getAsNullableString("name");
				let type = args.getAsNullableInteger("type");
				let fromTime = args.getAsNullableDateTime("from_time");
				let toTime = args.getAsNullableDateTime("to_time");
				this._logic.readOneCounter(correlationId, group, name, type, fromTime, toTime, callback);
			}
		);
	}

	private makeReadCountersCommand(): ICommand {
		return new Command(
			"read_counters",
			new ObjectSchema(true)
				.withRequiredProperty('counters', new ArraySchema(new StatCounterV1Schema()))
				.withRequiredProperty('type', TypeCode.Long)
				.withOptionalProperty('from_time', null) //TypeCode.DateTime)
				.withOptionalProperty('to_time', null), //TypeCode.DateTime)
			(correlationId: string, args: Parameters, callback: (err: any, result: any) => void) => {
				let counters: StatCounterV1[] = args.get("counters");
				let type = args.getAsNullableInteger("type");
				let fromTime = args.getAsNullableDateTime("from_time");
				let toTime = args.getAsNullableDateTime("to_time");
				this._logic.readCounters(correlationId, counters, type, fromTime, toTime, callback);
			}
		);
	}
}