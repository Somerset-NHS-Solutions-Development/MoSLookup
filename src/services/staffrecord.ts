import { Service, Inject } from 'typedi';
import { mssql, ConnectionPool } from 'mssql'

import logger from '../loaders/logger'
import config from '../config';

@Service()
export default class StaffRecordService {
	// Create connection to database
	private dbconfig = config.database;
	private connection = require('mssql');
	private pools = {};
	
	private async getPool(name, config) {
		try {
			if (!Object.prototype.hasOwnProperty.call(this.pools, name)) {
				const pool = new this.connection.ConnectionPool(config)
				pool.on('error', err => {
					// ... error handler
					throw new Error(err);
				})
				const close = pool.close.bind(pool)
				pool.close = (...args) => {
				  delete this.pools[name]
				  return close(...args)
				}
				await pool.connect()
				this.pools[name] = pool
			}
			return this.pools[name]
		} catch(err) {
			logger.error(err);
		}
	}
	
	private async getStaffPersonIDByStaffID(staffID = '123456789777') {
		logger.debug('Querying by staff ID');
		try {
			const pool = await this.getPool('default', this.dbconfig);
			const result = await pool.request()
					.input('staffID', this.connection.VarChar(50), staffID)
					.query(`SELECT DISTINCT TOP 1 person.[PersonID] 
					FROM [DWESR].[dbo].[WorkForcePersonAudit] person
					where EmployeeNumber like '%'+ @staffID +'%' and EfectiveToDate is NULL and person.[WarehouseEndDate] is NULL`)
					.catch(err => { throw new Error(err); });
			
			return result['recordset'][0]['PersonID'];
		} catch(err) {
			logger.error(err.message);
			throw new Error(err);
			return;
		}
	}
	
	private async getStaffPersonIDBySearch(name = '123456789777', dob = '1920-01-01') {
		logger.debug('Querying by name and DoB');
		try {
			const pool = await this.getPool('default', this.dbconfig);
			const result = await pool.request()
					.input('name', this.connection.VarChar(50), name)
					.input('dob', this.connection.VarChar(50), dob)
					.query(`SELECT DISTINCT person.[PersonID]
							  FROM [DWESR].[dbo].[WorkForcePersonAudit] person
							  where (LastName like '%'+@name+'%' or FirstName like '%'+@name+'%')
								and DateOfBirth = @dob
								and EfectiveToDate is NULL and person.[WarehouseEndDate] is NULL`)
			return result['recordset'];
		} catch(err) {
			logger.error('Unable to complete search. ' + err.message);
			throw new Error(err.message);			
		}
		
	}
	
	private async getStaffPersonRecord(personID = '123456789777') {
		logger.debug('Querying person record');
		try {
			const pool = await this.getPool('default', this.dbconfig);
			const result = await pool.request()
					.input('personID', this.connection.VarChar(50), personID)
					.query(`SELECT DISTINCT TOP 1 person.[PersonID]
							  ,person.[EmployeeNumber]
							  ,person.[Title]
							  ,person.[LastName]
							  ,person.[FirstName]
							  --,person.[MiddleNames]	  
							  --,person.[MaidenNames]
							  ,person.[PreferredName]
							  --,person.[PreviousLastName]
							  --,person.[Gender]
							  ,person.[DateOfBirth]
							  --,person.[NationalInsuranceNumber]
							  --,person.[NHSCRSUUID]
							  ,person.[OfficeE-MailAddress]
							  ,person.[LastUpdateDate]
						  FROM [DWESR].[dbo].[WorkForcePersonAudit] person
						  where person.PersonID = @personID and EfectiveToDate is NULL and person.[WarehouseEndDate] is NULL
						  order by LastUpdateDate desc`)
						  .catch(err => { throw new Error(err);});
			return result['recordset'][0];
		} catch(err) {
			logger.error(err);
			throw new Error(err);
		}
		
	}
	
	private async getStaffPersonAssignment(personID = '123456789777') {
		logger.debug('Querying assignments');
		try {
			const pool = await this.getPool('default', this.dbconfig);
			const result = await pool.request()
					.input('personID', this.connection.VarChar(50), personID)
					.query(`SELECT DISTINCT position.PositionNumber
						  ,assignment.PositionName
						  ,position.JobStaffGroup
						  ,position.JobRole
					  FROM [DWESR].[dbo].[WorkForceAssignmentAudit] assignment 
					  LEFT OUTER JOIN [DWESR].[dbo].[WorkForcePositionAudit] position on assignment.PositionID = position.PositionID and position.EfectiveToDate is null and position.WarehouseEndDate is null
					  WHERE assignment.PersonID = @personID and assignment.EffectiveEndDate is null and assignment.WarehouseEndDate is null`)
					  .catch(err => { throw new Error(err);});
			return result['recordset'];
		} catch(err) {
			logger.error(err);
			throw new Error(err);
		}
	}
	
	private async processStaffPersonSet(list) : Promise<any> {	
		const objectsout = list.map(async  (o) => {
			let personObject : any = await this.getStaffPersonRecord(o.PersonID);
			personObject['Assignments'] = await this.getStaffPersonAssignment(o.PersonID);			
			return new Promise((res, rej) => {res(personObject)})
		});		
		return Promise.all(objectsout)
		.then((results) => {
		  return results;
		})
		
	}
	
	

	public async getStaffMemberByID(staffID = '123456789777') {
		logger.debug('Building Staff Object');
		try {
			const personID = await this.getStaffPersonIDByStaffID(staffID);		
			const personObject : any = await this.getStaffPersonRecord(personID);
			personObject['Assignments'] = await this.getStaffPersonAssignment(personID);			
			return new Promise(function(resolve, reject) {
				resolve(personObject);
				
			}).catch(error => logger.error(error.message));
		} catch(err) {
			throw new Error('Could not complete request due to an internal server error');
		}
		
	}
	
	public async getStaffMemberSearch(name = 'zzzzzzzzzzzzzzz', dob = '1620-01-29') {
		try {
			logger.debug('Building Result set');
			const personIDSet = await this.getStaffPersonIDBySearch(name,dob);
			let personObjectSet = [];
			if(personIDSet && personIDSet.length > 0){
				personObjectSet = await this.processStaffPersonSet(personIDSet);
			}
			
			return new Promise(function(resolve, reject) {
				if(personObjectSet){
				resolve(personObjectSet);
				} else {
					reject()
				}
			}).catch(err => {
				logger.error(err.message);
			});
		} catch(err) {
			throw new Error('Could not complete search due to an internal server error');
		}
		
	}
	
}