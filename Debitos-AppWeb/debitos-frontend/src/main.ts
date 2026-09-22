import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { Chart, registerables } from 'chart.js';

registerLocaleData(localeEsAr, 'es-AR');
Chart.register(...registerables);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

