#
# Клиентское консольное приложение на Phynon для проверки серверной части 
#
import requests

while True:
    # 1. Формируем запрос к серверу и отправляем его на сервер
    print("Введите долготу ИПМ ") 
    lon1 = input()

    print("Введите широту ИПМ ") 
    lat1 = input()

    print("Введите долготу КПМ ") 
    lon2 = input()

    print("Введите широту КПМ ") 
    lat2 = input()

    print("Введите количество ППМ ") 
    n = input()

    
    # 2. Формируем запрос к серверу и отправляем его на сервер
    #req = "http://127.0.0.1:8080/?lon1=10&lat1=0.5&lon2=15&lat2=1&n=10"
    req = "http://127.0.0.1:8080/?lon1=" + lon1 + "&lat1=" + lat1 + "&lon2=" + lon2 + "&lat2=" + lat2 + "&n=" + n 
    print(req)
    response = requests.get(req)

    # 3. Фиксируем ответ от сервера (преобразование элементов списка с координатами к исходному типу floft выполняется автоматически
    coordList = response.json()
    for i in range(len(coordList)):
        for j in range(len(coordList[i])):
           print(coordList[i][j], end = ' ')
        print()
    
    print("Выполнить новый запрос? (1 - Да):  ")    
    ans = input()
    if(ans) != '1':
      break