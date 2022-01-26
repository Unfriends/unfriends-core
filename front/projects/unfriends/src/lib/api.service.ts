import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

const API_URL = "api-url";
const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWQiOiJmNWYxNmFkMS1lMTI2LTQ4ZjUtYjA0Ni0wNzljMzFjNzU3NWIiLCJpYXQiOjE1MTYyMzkwMjJ9._fRWQb5V9jkE4NCXUs6GimSOodScxSqWGQuZve4NEcA";

@Injectable()
export class ApiService {

    private jwt: string | null = null
    public profile: any

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject('environment') private environment: any
    ) {
        // console.log("environment", environment);

        if (isPlatformBrowser(this.platformId))
            this.jwt = localStorage.getItem('jwt');

        if (this.jwt) {
            this.getProfile().subscribe((data) => {
                this.profile = data
            })
        }
    }

    public getToken() {
        return fakeJwt
        return this.jwt;
    }

    //////// ROUTES ////////

    // USER //

    public getUserFromId(id: string) {
        return this.http.get<any>(API_URL + 'user/infos/' + id);
    }

    public getProfile() {
        return this.http.get<any>(API_URL + 'user/me');
    }

    public getId() {
        if (this.profile)
            return this.profile.id
        else
            // TODO get profile from api
            return 'f5f16ad1-e126-48f5-b046-079c31c7575b'
    }
}
