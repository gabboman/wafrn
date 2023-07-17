import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { server } from '../interfaces/servers';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(
    private http: HttpClient
  ) { }

  async getServers(): Promise<server[]> {
    const response = await this.http.get<{servers: server[]}>(`${environment.baseUrl}/admin/server-list`).toPromise();
    return response?.servers ? response?.servers : [];
  }

  async updateServers(serversToUpdate: server[]) {
    const response = await this.http.post(`${environment.baseUrl}/admin/server-update`, serversToUpdate).toPromise()
    return response;
  }

  async getBlocks(): Promise<any> {
    const response = await this.http.get(`${environment.baseUrl}/admin/userBlockList`).toPromise();
    return response;
  }

  async getReports(): Promise<any> {
    const response = await this.http.get(`${environment.baseUrl}/admin/reportList`).toPromise();
    return response;
  }


}
