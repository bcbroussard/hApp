import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service'

declare var google;

export enum DrawingObjectType {
    MARKER = 0,
    POLYLINE = 1,
    POLYGON = 2
}

@Injectable()
export class DrawingService {
    
    constructor() {
        console.info('DrawingService constructor');
    }

    public static GetMarker (map) :any {
        
        var iconStr = 'http://maps.google.com/mapfiles/ms/icons/' + SettingsService.mapDefaultMarkerColor + '-dot.png'
        
        let marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: map.getCenter(),
            draggable: true,
            icon: iconStr
        });

        return marker;
    }

    public static GetPoyline (map) :any {
        return new google.maps.Polyline({
            map: map,
            animation: google.maps.Animation.DROP,
            path: [ ],
            draggable: true,
            editable: true
        });
    }
    
    public static GetPolygon (map) :any {

        return new google.maps.Polygon({
            map: map,
            animation: google.maps.Animation.DROP,
            path: [ ],
            draggable: true,
            editable: true
        });
    }


    // Get Path : string
    // return the path or position in a string format we like
    // to save in the db
    // format: {"lat":39.28569379531456,"lng":-76.58095121383667},
    // - or - an array of those [{ lat: 3.1, lng:-5.6 },{...}, {...}, ...]
    public static GetPathString(drawingObject): string {
        
        console.log('DrawingService GetPath() drawingObject', drawingObject);

        // for lines and shapes
        if (drawingObject.getPath) {

            var result = [];
            var points = drawingObject.getPath();
            for (var i = 0; i < points.getLength(); i++) {
                var pnt = points.getAt(i);
                result.push({ lat: pnt.lat(), lng: pnt.lng() });
            }
            console.log('DrawingService GetPath() result', result);
            return JSON.stringify(result);
        } 
        // for markers
        else {
            var pos = drawingObject.getPosition();
            console.log('DrawingService GetPath() pos', pos);
            return JSON.stringify({ lat: pos.lat(), lng: pos.lng() });
        }
    }


    // Get Quantity : number (whole)
    public static GetQuantity(drawingObject): number {        
        console.log('DrawingService GetQuantity() drawingObject', drawingObject);
        
        var quant:number = 0;
        
        if (!drawingObject.getPath) {
            console.log('> marker - no getPath method');
            return null;
        }
        else if (drawingObject.acgo.drawingObjectType == DrawingObjectType.POLYLINE) {
            let path = drawingObject.getPath();
            console.log('> polyline path: ', path);
            // meters to feet
            quant = google.maps.geometry.spherical.computeLength(path) * 3.28084;
        }
        else {
            let path = drawingObject.getPath();
            console.log('> polygon path: ', path);
            // square meters to sqaure feet
            quant = google.maps.geometry.spherical.computeArea(path) * 10.7639;
        }
            console.log('> quant: ', quant);
        
        return Math.round(quant);
    }

    public static markerColorOptions = [
        'red',
        'green',
        'blue',
        'orange',
        'yellow',
        'purple'
    ]
}