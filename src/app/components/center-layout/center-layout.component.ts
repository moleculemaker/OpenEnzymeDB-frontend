import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-center-layout',
    templateUrl: './center-layout.component.html',
    styleUrls: ['./center-layout.component.scss'],
    host: {
        class: 'grow flex flex-col justify-center'
    },
    standalone: true,
    imports: [RouterOutlet]
})
export class CenterLayoutComponent {

}
