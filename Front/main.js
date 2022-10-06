/*
 Сервер визуализации для задачи расчета ортодромии
 Прикладной функционал:
 1.Загрузка и отображение карты с растрововым слоем (подложка)
 2.Масшабирование и смещение изображения 
 3.Формирование GET запроса для отправки на расчетный Python-сервер
   (данные для формирования берутся из окошек пользовательского интерфейса) 
 4.Отправка асинхронного запроса на расчетный Python-сервер (по щелчку на кнопке)
 5.Визуализация полученных данных с расчетного Python-сервера:
    -Сдвиг изображения карты в точку ИПМ      
    -Формирование и отображение слоя с точками ИПМ и КПМ 
    -Формирование и отображения слоя с полилинией ортодромии
  6.Вывод координат точек ортодромии в текстовом окне  
*/

import {Feature, Map, Overlay, View} from 'ol/index';
import {OSM, Vector as VectorSource} from 'ol/source';
import {LineString, Point, Polygon} from 'ol/geom';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {useGeographic} from 'ol/proj';

useGeographic();

//Создание объекта для прорисовки карты
const view = new View({
  center: [37.6178, 55.7517], //Это Москва
  zoom: 5,
});


//Создание объекта карты с привязкой к объекту прорисовки:
//  - один растровый слой
//  - источник: открытые карты OSM  
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      preload: 4,
      source: new OSM(),
    }),
  ],
  view: view,
});

//Функция для занесения в список обработчиков ссылки на функцию callback для обрабобки события onClick  на элементе пользовательского интерфейса с идентификатором id 
function onClick(id, callback) {
  document.getElementById(id).addEventListener('click', callback);
}

//Обработчик события на кнопке с идентификатором start (это кнопка пользовательского интерфейса с надписью Calculate)
onClick('start', function () {

//1. Очистка предыдущих изображений точек ИПМ и КПМ и полилинии ортодромии путем удаления этих слоев из карты
//   (если они есть)  
var mylayers =   map.getLayers();
if(mylayers.getLength()>1)
{ 
    mylayers.removeAt(1);
    mylayers.removeAt(1);
}  

//2.Формированиек строки GET запAзапроса на расчетный Python-сервер  
var lon1 = document.getElementById('lon1').value;
var lat1 = document.getElementById('lat1').value;
var lon2 = document.getElementById('lon2').value;
var lat2 = document.getElementById('lat2').value;
var n = document.getElementById('npoint').value;

var req = "http://127.0.0.1:8080/?lon1=" + lon1 + "&lat1=" + lat1 + "&lon2=" + lon2 + "&lat2=" + lat2 + "&n=" + n 

//3.Отправка асинхронного запроса на расчетный Python-сервер  
$.ajax({url:req,
        method: 'GET'
       })
 //Обработка ответа от сервера после его получения
 //Данные от сервера функция обрабоки получает через параметр ort
  .then( function (ort) 
       { 
        //Формируем объекты-точки для визуализации ИПМ и КПМ
        var ortlen = ort.length;
        const placeStart = ort[0];
        const placeEnd = ort[ortlen-1];
        const point1 = new Point(placeStart);
        const point2 = new Point(placeEnd);

       
         //Формируем объект-полилинию для визуализации ортодромии
        const lineFeature = new Feature(
          new LineString(ort)
        );
        
       //Центрируем карту относительно ИПМ
       view.animate({
       center: placeStart,
       duration: 2000,
      });

      //Добавляем в карту слой с точками ИПМ и КПМ (и отображаем его)
        map.addLayer( new VectorLayer({
          source: new VectorSource({
            features: [new Feature(point1),new Feature(point2)],
          }),
          style: {
            'circle-radius': 7,
            'circle-fill-color': 'red',
          },
        }));
        
      //Добавляем в карту слой с полилинией (и отображаем его)  
        map.addLayer(new VectorLayer({
          source: new VectorSource({
            features: [lineFeature],
          }),
          style: {
            'stroke-width': 2,
            'stroke-color': [255, 0, 22, 1],
            'fill-color': [0, 0, 255, 0.6],
          },
        }));
        
      //Получаем из пользовательского интерфейса элемент для вывода ортодромии в текстовом виде по его идентификатору 
        var out = document.getElementById('output');
        
      //Очищаем предыдущий вывод  
        out.value = "";
        
        
        var i;
        var j;
        for(i=0; i<ort.length; i++ )
         {
             //Формируем текстовую строку по данным очередной точки ортодромии и присоединяем ее к уже имеющейся строке в элемента вывода out
             out.value = out.value + '[' + ort[i][0] + "," + ort[i][1]+"]  ";
         }
      
       })
 //Обработка исключения (Исключение формируется при ошибке выполнения запроса на расчетном Python-сервере)
 //Обработка сводится к выводу в консоль браузера данных об ошибочной ситуации (err), полученных с Python-сервера      
 .catch(function (err) { console.log('err')});

});
