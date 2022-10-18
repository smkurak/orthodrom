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
  //control:null,
  target: 'map',
  layers: [
    new TileLayer({
      preload: 4,
      source: new OSM(),
    }),
  ],
  view: view,
});

/*
  Функция LonTest проверят значение долготы на корректность
  Входные папраметры: lon - долгота
  Возвращаемое значение: строка символов
     "Longitude is not a number" - lon содержит недопустимые символы
     "Longitude out of range (-180, 180)" - значение lon находится за пределами допустимого диапазона 
     "OK" - lon содержит корректное значение
*/
function LonTest(lon)
{
  var numberLon = Number(lon);
  if(Number.isNaN(numberLon) == true)
  {
     return "Longitude is not a number";
  }
  
  if(numberLon < -180 || numberLon > 180)
  {
    return "Longitude out of range (-180, 180)";  
  }
  else
  {
    return "OK";  
  }
}

/*
  Функция LatTest проверят значение широты на корректность
  Входные папраметры: lat - широта
  Возвращаемое значение: строка символов
     "Latitude is not a number" - lat содержит недопустимые символы
     "Latitude out of range (-90, 90)" - значение lat находится за пределами допустимого диапазона 
     "OK" - lat содержит корректное значение
*/
function LatTest(lat)
{
  var numberLat = Number(lat);
  if(Number.isNaN(numberLat) == true)
  {
    return "Latitude is not a number";
  }
  
  if(numberLat < -90 || numberLat > 90)
  {
    return "Latitude out of range (-90, 90)";  
  }
  else
  {
    return "OK";  
  }
}

/*
  Функция PointTest проверят значение количества точек в ортодромии
  Входные папраметры: nPoint - количество точек
  Возвращаемое значение: строка символов
     "Number of points is not integer number" - nPoint содержит недопустимые символы
     "Number of points of ange (5, 10 090)" - значение nPoint находится за пределами допустимого диапазона 
     "OK" - nPoint содержит корректное значение
*/
function PointTest(nPoint)
{
  var n = Number(nPoint);
  if(Number.isInteger(n) == false)
  {
    return "Number of points is not integer number";
  }
  if(String(nPoint).indexOf('.') >= 0)
  {
    return "Number of points is not integer number";
  }
  
  if(n < 5 || n > 10000)
  {
    return "Number of points of ange (5, 10 000)";  
  }
  else
  {
    return "OK";  
  }
}



//Функция для занесения в список обработчиков ссылки на функцию callback для обрабобки события onClick  на элементе пользовательского интерфейса с идентификатором id 
function onClick(id, callback) {
  document.getElementById(id).addEventListener('click', callback);
}

//Обработчик события на кнопке с идентификатором start (это кнопка пользовательского интерфейса с надписью Calculate)
onClick('start', function () {

//1. Очистка предыдущих изображений точек ИПМ и КПМ и полилинии ортодромии путем удаления этих слоев из карты
//   (если они есть)  
var mylayers;
while(true) 
{
   mylayers =   map.getLayers();
   if(mylayers.getLength()<2)  break;
   mylayers.removeAt(1);
}  

//2.Формированиек строки GET запроса на расчетный Python-сервер  
var testResult;

var lon1 = document.getElementById('lon1').value;
testResult = LonTest(lon1);
if(testResult != "OK")
  {
    window.alert("LON1: " + testResult);
    return;
  }

var lat1 = document.getElementById('lat1').value;
testResult = LatTest(lat1);
if(testResult != "OK")
  {
    window.alert("LAT1: " + testResult);
    return;
  }

var lon2 = document.getElementById('lon2').value;
testResult = LonTest(lon2);
if(testResult != "OK")
  {
    window.alert("LON2: " + testResult);
    return;
  }

var lat2 = document.getElementById('lat2').value;
testResult = LatTest(lat2);
if(testResult != "OK")
  {
    window.alert("LAT2: " + testResult);
    return;
  }

var n = document.getElementById('npoint').value;
testResult = PointTest(n);
if(testResult != "OK")
  {
    window.alert("NPt: " + testResult);
    return;
  }

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
             out.value = out.value + '[' + ort[i][0] + ", " + ort[i][1]+"]  ";
         }
      
       })
 //Обработка исключения (Исключение формируется при ошибке выполнения запроса на расчетном Python-сервере)
 //Обработка сводится к выводу в консоль браузера данных об ошибочной ситуации (err), полученных с Python-сервера      
 .catch(function (err) { console.log('err')});

});




