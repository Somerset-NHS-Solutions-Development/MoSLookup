
//import { Connection, Request, TYPES } from 'tedious'
import { Service, Inject } from 'typedi';
import { mssql, ConnectionPool } from 'mssql'

import logger from '../loaders/logger'
import config from '../config';



// Attempt to connect and execute queries if connection goes through


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
		console.log('Reading rows from the Table...');
					
		const pool = await this.getPool('default', this.dbconfig);
		const result = await pool.request()
				.input('staffID', this.connection.VarChar(50), staffID)
				.query(`SELECT DISTINCT TOP 1 person.[PersonID] 
				FROM [DWESR].[dbo].[WorkForcePersonAudit] person
				where EmployeeNumber like '%'+ @staffID +'%' and EfectiveToDate is NULL and person.[WarehouseEndDate] is NULL`)
		
		return result['recordset'][0]['PersonID'];
	}
	
	private async getStaffPersonIDBySearch(name = '123456789777', dob = '1920-01-01') {
		console.log('Reading rows from the Table...');
		const pool = await this.getPool('default', this.dbconfig);
		const result = await pool.request()
				.input('name', this.connection.VarChar(50), name)
				.input('dob', this.connection.VarChar(50), dob)
				.query(`SELECT DISTINCT top 1 @personID = person.[PersonID]
						  FROM [DWESR].[dbo].[WorkForcePersonAudit] person
						  where (LastName like '%'+name+'%' or FirstName like '%'+@name+'%')
							and DateOfBirth = @dob
							and EfectiveToDate is NULL and person.[WarehouseEndDate] is NULL`)
		
		return result;
		
	}
	
	private async getStaffPersonRecord(personID = '123456789777') {
		console.log('Reading rows from the Table...');
		const pool = await this.getPool('default', this.dbconfig);
		const result = await pool.request()
				.input('personID', this.connection.VarChar(50), personID)
				.query(`SELECT DISTINCT TOP 1 person.[PersonID]
						  ,person.[EmployeeNumber]
						  ,person.[Title]
						  ,person.[LastName]
						  ,person.[FirstName]
						  ,person.[MiddleNames]	  
						  ,person.[MaidenNames]
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
		console.dir(result)
		return result['recordset'][0];
		
	}
	
	private async getStaffPersonAssignment(personID = '123456789777') {
		console.log('Reading rows from the Table...');
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
		
		console.dir(result)
		return result['recordset'];
	}
	
	

	public async getStaffMemberByID(staffID = '123456789777') {
		console.log('Building Staff Object');
		const personID = await this.getStaffPersonIDByStaffID(staffID);
		// const personRecord = await this.getStaffPersonRecord(personID);
		//const personAssignments = await this.getStaffPersonAssignment(personID);
		
		const personObject : any = await this.getStaffPersonRecord(personID);
		personObject['Assignments'] = await this.getStaffPersonAssignment(personID);
		
		return new Promise(function(resolve, reject) {
			console.dir(personObject);
			resolve(personObject);
			
		}).catch(error => logger.error(error.message));
		
	}
	
}