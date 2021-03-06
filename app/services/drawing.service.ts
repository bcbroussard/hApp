import { Injectable } from '@angular/core';
import { SettingsStatic } from './settings.static'

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

    static parsePath(path: any, defaultVal: any): any {
        if (path) {
            // restore marker
            if (typeof (path) != "object") path = JSON.parse(path);
        }
        else {
            // new marker
            path = defaultVal;
        }

        return path;
    }

    // TODO: needs refactoring
    public static setColor(drawingObject, color?: string) {

        // if it's a marker...
        if (!drawingObject.getPath) {
            var iconStr;
            // if no color specified, use default
            if (!color || color.length == 0) {
                iconStr = 'http://maps.google.com/mapfiles/ms/icons/' + SettingsStatic.mapDefaultMarkerColor + '-dot.png'
            }
            // if color is in hex, get a color name value
            else if (color[0] == "#") {
                var i = SettingsStatic.arrayOfColors.indexOf(color);
                iconStr = 'http://maps.google.com/mapfiles/ms/icons/' + SettingsStatic.markerColors[i] + '-dot.png';
            }
            else {
                iconStr = 'http://maps.google.com/mapfiles/ms/icons/' + color + '-dot.png';
            }
            drawingObject.setOptions({
                icon: iconStr
            });
        }
        else {
            drawingObject.setOptions({
                strokeColor: color,
                fillColor: color // lines will ignore fillColor
            });
        }
    }

    public static setEditable(drawingObject: any, editable: boolean = true) {
        if (drawingObject.setEditable) drawingObject.setEditable(editable);
        drawingObject.setDraggable(editable);
    }

    public static GetMarker(map, path?: any): any {

        var iconStr = 'http://maps.google.com/mapfiles/ms/icons/' + SettingsStatic.mapDefaultMarkerColor + '-dot.png'

        let marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: this.parsePath(path, map.getCenter()),
            icon: iconStr
        });

        return marker;
    }

    public static GetPoyline(map, path?: any, color?: string): any {

        var options = {
            map: map,
            path: this.parsePath(path, []),
            strokeWeight: SettingsStatic.defaultPolylineStrokeWeight
        }

        if (color) {
            options['strokeColor'] = color;
        }

        return new google.maps.Polyline(options);
    }

    public static GetPolygon(map, path?: any, color?: string): any {

        var options: any = {
            map: map,
            animation: google.maps.Animation.DROP,
            path: this.parsePath(path, []),
        }

        if (color) {
            options['strokeColor'] = color;
            options['fillColor'] = color;
        }

        return new google.maps.Polygon(options);
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

        var quant: number = 0;

        if (!drawingObject.getPath) {
            console.log('> marker - no getPath method');
            if (drawingObject.acgo) return drawingObject.acgo.quantity; // if quant is already specified, return that
            else return 1;
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

    public static CenterOnDrawingObject(map, drawingObject) {
        // just a simpler version of fit to many
        this.CenterOnDrawingObjects(map, [drawingObject]);
    }

    public static CenterOnDrawingObjects(map, list) {
        var bounds = new google.maps.LatLngBounds();
        list.forEach(drawingObject => {

            // filter out items not currently attached to the map
            if (drawingObject.getMap() != null) {

                if (drawingObject.getPath) {
                    // for shapes
                    var path = drawingObject.getPath();
                    for (var i = 0; i < path.getLength(); i++)
                        bounds.extend(path.getAt(i));
                } else {
                    // for markers
                    bounds.extend(drawingObject.getPosition());
                }
            }
        });
        console.log('> fitting Bounds:', bounds);
        map.fitBounds(bounds);
    }
}