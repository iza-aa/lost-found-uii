import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { SearchComponent } from './features/search/search.component';
import { PostItemComponent } from './features/post-item/post-item.component';
import { RadarComponent } from './features/radar/radar.component';
import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'post-item', component: PostItemComponent },
  { path: 'radar', component: RadarComponent },
  { path: 'profile', component: ProfileComponent },
];
