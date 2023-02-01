import sql from "./sql";

class UsersData {

  private workspaces:string[] = [];
  private users:any = {};

  constructor() {
  }

  private async loadWorkspaces() {
    let ans = await sql`    
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN 
        ('pg_toast', 'pg_catalog', 'information_schema', 'admin', 'public')`;

    if (ans == null || ans.length < 1) return [];

    let workspaces = ans.map((r: any) => r.schema_name);

    return workspaces;
  }

  private async loadWorkspaceUsers(workspace: string) {
    const ans = await sql`
        SELECT 
            U.uuid,
            U.name,
            U.login,
            U.mail,
            U.telegram,
            U.telegram_id,
            U.discord,
            U.discord_id
        FROM ${sql(workspace + '.users') } U
        WHERE U.active AND U.deleted_at IS NULL
        `;
    let workspaceUsers: any = {};

    for (let i = 0; i < ans.length; i++) {
      workspaceUsers[ans[i].uuid] = ans[i];
    }

    return workspaceUsers;
  }

  public async init() {
    this.workspaces = await this.loadWorkspaces();

    let users: any = {};

    for (let i = 0; i < this.workspaces.length; i++) {
      users[this.workspaces[i]] = await this.loadWorkspaceUsers(this.workspaces[i]);
    }

    this.users = users;
    console.log('Users loaded')

    await sql.subscribe('*', this.handleNotify.bind(this), this.handleSubscribeConnect)
  }

    public getUser(uuid:string){
        for (let i = 0; i < this.workspaces.length; i++) {
            if(this.users[this.workspaces[i]][uuid]) {
                return this.users[this.workspaces[i]][uuid]
            }
        }
        return null
    }

    public async setTelegramtId(username:string, id:string){
        console.log('setTelegramtId')
        let found = false
        for (let i = 0; i < this.workspaces.length; i++) {
            let ans = await sql`
            UPDATE ${sql(this.workspaces[i] + '.users') } 
            SET telegram_id = ${id}
            WHERE telegram_id = '' AND telegram = ${username} AND active AND deleted_at IS NULL
            RETURNING uuid`;
            if(ans.length > 0) found = true
        }
        return found
    }

    public async setDiscordId(username:string, id:string){
        console.log('setDiscordId')
        let found = false
        for (let i = 0; i < this.workspaces.length; i++) {
            let ans = await sql`
            UPDATE ${sql(this.workspaces[i] + '.users') } 
            SET discord_id = ${id}
            WHERE discord_id = '' AND discord = ${username} AND active AND deleted_at IS NULL
            RETURNING uuid`;
            if(ans.length > 0) found = true
        }
        return found
    }

    private async handleNotify(row:any, { command, relation, key, old }: any){
        if(relation.table != 'users') return
        if(!this.users[relation.schema]) return
        console.log('updating user data')
        this.users[relation.schema] = await this.loadWorkspaceUsers(relation.schema)
    }

    private handleSubscribeConnect(){
        console.log('subscribe sql connected!')
    }

}

export default UsersData