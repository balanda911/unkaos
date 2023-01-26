const postgres = require('postgres') 
import tools from "../tools";
import dbConf from '../db_conf.json';

let hermesDbConf = tools.obj_clone(dbConf)
hermesDbConf.publications = 'hermes_publication'

const sql = postgres(hermesDbConf)

export default sql