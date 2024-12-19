export * from './dataDfKcat.service';
import { DataDfKcatService } from './dataDfKcat.service';
export * from './dataDfKcatkm.service';
import { DataDfKcatkmService } from './dataDfKcatkm.service';
export * from './dataDfKm.service';
import { DataDfKmService } from './dataDfKm.service';
export * from './introspection.service';
import { IntrospectionService } from './introspection.service';
export const APIS = [DataDfKcatService, DataDfKcatkmService, DataDfKmService, IntrospectionService];
