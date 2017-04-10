import { Factory } from 'pip-services-commons-node';
import { Descriptor } from 'pip-services-commons-node';

import { StatisticsMongoDbPersistence } from '../persistence/StatisticsMongoDbPersistence';
import { StatisticsFilePersistence } from '../persistence/StatisticsFilePersistence';
import { StatisticsMemoryPersistence } from '../persistence/StatisticsMemoryPersistence';
import { StatisticsController } from '../logic/StatisticsController';
import { StatisticsHttpServiceV1 } from '../services/version1/StatisticsHttpServiceV1';
import { StatisticsSenecaServiceV1 } from '../services/version1/StatisticsSenecaServiceV1'; 

export class StatisticsFactory extends Factory {
	public static Descriptor = new Descriptor("pip-services-statistics", "factory", "default", "default", "1.0");
	public static MemoryPersistenceDescriptor = new Descriptor("pip-services-statistics", "persistence", "memory", "*", "1.0");
	public static FilePersistenceDescriptor = new Descriptor("pip-services-statistics", "persistence", "file", "*", "1.0");
	public static MongoDbPersistenceDescriptor = new Descriptor("pip-services-statistics", "persistence", "mongodb", "*", "1.0");
	public static ControllerDescriptor = new Descriptor("pip-services-statistics", "controller", "default", "*", "1.0");
	public static SenecaServiceDescriptor = new Descriptor("pip-services-statistics", "service", "seneca", "*", "1.0");
	public static HttpServiceDescriptor = new Descriptor("pip-services-statistics", "service", "http", "*", "1.0");
	
	constructor() {
		super();
		this.registerAsType(StatisticsFactory.MemoryPersistenceDescriptor, StatisticsMemoryPersistence);
		this.registerAsType(StatisticsFactory.FilePersistenceDescriptor, StatisticsFilePersistence);
		this.registerAsType(StatisticsFactory.MongoDbPersistenceDescriptor, StatisticsMongoDbPersistence);
		this.registerAsType(StatisticsFactory.ControllerDescriptor, StatisticsController);
		this.registerAsType(StatisticsFactory.SenecaServiceDescriptor, StatisticsSenecaServiceV1);
		this.registerAsType(StatisticsFactory.HttpServiceDescriptor, StatisticsHttpServiceV1);
	}
	
}
