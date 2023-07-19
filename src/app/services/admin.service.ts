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
    return this.http.get(`${environment.baseUrl}/admin/reportList`).toPromise();
  }

  async ignoreReport(id: number): Promise<any> {
    return this.http.post(`${environment.baseUrl}/admin/ignoreReport`, {id: id }).toPromise();
  }

  async banUser(id: number) {
    return this.http.post(`${environment.baseUrl}/admin/banUser`, {id: id }).toPromise();
  }

  async getOpenReportsCount(): Promise<any> {
    return this.http.get(`${environment.baseUrl}/admin/reportCount`).toPromise()
  }


}
