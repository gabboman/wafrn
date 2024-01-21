import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { server } from '../interfaces/servers';
import { firstValueFrom } from 'rxjs';
import { SimplifiedUser } from '../interfaces/simplified-user';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) {}

  async getServers(): Promise<server[]> {
    const response = await firstValueFrom(
      this.http.get<{ servers: server[] }>(
        `${environment.baseUrl}/admin/server-list`
      )
    );
    return response?.servers ? response?.servers : [];
  }

  async updateServers(serversToUpdate: server[]) {
    const response = await firstValueFrom(
      this.http.post(
        `${environment.baseUrl}/admin/server-update`,
        serversToUpdate
      )
    );
    return response;
  }

  async getBlocks(): Promise<any> {
    const response = await firstValueFrom(
      this.http.get(`${environment.baseUrl}/admin/userBlockList`)
    );
    return response;
  }

  async getReports(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${environment.baseUrl}/admin/reportList`)
    );
  }

  async ignoreReport(id: number): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/admin/ignoreReport`, { id: id })
    );
  }

  async banUser(id: string) {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/admin/banUser`, { id: id })
    );
  }

  async banList() {
    return firstValueFrom(
      this.http.get(`${environment.baseUrl}/admin/getBannedUsers`)
    );
  }
  async pardonUser(id: string) {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/admin/unbanUser`, { id: id })
    );
  }
  async getOpenReportsCount(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${environment.baseUrl}/admin/reportCount`)
    );
  }

  async getPendingActivationUsers(): Promise<SimplifiedUser[]> {
    return firstValueFrom(
      this.http.get<SimplifiedUser[]>(
        `${environment.baseUrl}/admin/getPendingApprovalUsers`
      )
    );
  }

  async requireExtraSteps(id: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/admin/notActivateAndSendEmail`, {
        id,
      })
    );
  }

  async activateUser(id: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.baseUrl}/admin/activateUser`, {
        id,
      })
    );
  }
}
