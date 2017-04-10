import { ConfigParams } from 'pip-services-commons-node';
import { FilterParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';
import { DataPage } from 'pip-services-commons-node';
import { JsonFilePersister } from 'pip-services-data-node';

import { StatisticsMemoryPersistence } from './StatisticsMemoryPersistence';
import { StatCounterRecordV1 } from '../data/version1/StatCounterRecordV1';

export class StatisticsFilePersistence extends StatisticsMemoryPersistence {
	protected _persister: JsonFilePersister<StatCounterRecordV1>;

    public constructor(path?: string) {
        super();

        this._persister = new JsonFilePersister<StatCounterRecordV1>(path);
        this._loader = this._persister;
        this._saver = this._persister;
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._persister.configure(config);
    }

}