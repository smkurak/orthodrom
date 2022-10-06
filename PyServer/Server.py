# Python 3 сервер
# Прикладной функционал:
# 1.Расчет ортодромии с использованием параметров Земли WGS84
#    Исходные данные принимаются через GET запрос 
#       Ключи параметров:
#          lon1      - долгота ИПМ 
#          lat1      - широта  ИПМ 
#          lon2      - долгота КПМ 
#          lat2      - широта  КПМ 
#          n         - количество ППМ

#    Результаты расчета при обработке запроса передаются в формате JSON в виде списка координат точек ортодромии
#      Длина списка соответствует количеству точек
#      Элемент списка представляет собой список из двух значений:
#          - долгота точки 
#          - широта  точки 

from http.server import BaseHTTPRequestHandler, HTTPServer
import sys, string, cgi, time, datetime
import time
from os import curdir, sep
from urllib.parse import urlparse
import json
from array import *
from pyproj import Geod


hostName = "localhost"  #URL сервера 
serverPort = 8080       #Порт сервера    

########## Класс определяет метод обработки GET запроса ########################
class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Обработка заголовка запроса и извлечение из него исходных данных  
        query = urlparse(self.path).query
        query_components = dict(qc.split("=") for qc in query.split("&")) #Извлечение данных из запроса в виде ключ-значение
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header("Content-type", "text/json")
        self.end_headers()


       # 2. Получение по ключу данных в виде строки и преобразование их к типам параметров библиотечной функции расчета ортодромии npts() 
        lon1= float(query_components['lon1'])   
        lat1= float(query_components['lat1'])   
        lon2= float(query_components['lon2'])   
        lat2= float(query_components['lat2'])  
        n = int(query_components['n']);
        
        radians = False
        initial_idx = 0;
        terminus_idx = 0;
       
       # 3. Создание объекта для работы с геодезическими преобразованиями в системе параметров Земли WGS84
        g = Geod(ellps="WGS84")   
                                 
       # 4. Вычисление ортодромии (вычисленные координаты точек ортодромии заносятся в массив coordList
        coordList = g.npts(lon1,lat1,lon2,lat2,n,radians,initial_idx,terminus_idx)
               
       # 5. Возврат ортодромии (массив coordList) через JSON
        self.wfile.write(bytes(json.dumps(coordList), "utf-8"))
################################################################################


if __name__ == "__main__":        
    webServer = HTTPServer((hostName, serverPort), MyServer)          # Создание объекта (сервера) 
    print("Server created http://%s:%s" % (hostName, serverPort))     # Сообщение о создании сервера 

    try:
        webServer.serve_forever()     #Запуск цикла ожидания запросов к серверу
    except KeyboardInterrupt:         #Перехват попытки администратора закрыть сервер управляющими клавишами      
        pass                        
    webServer.server_close()
    print("Server stopped.")