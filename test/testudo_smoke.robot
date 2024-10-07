*** Settings ***
Library  SeleniumLibrary


*** Test Cases ***
Testudo App Smoke testi
    Avaa selain
    Kirjaudu Testudoon
    Valitse Home välilehti


*** Keywords ***
Avaa selain
    Open Browser    http://localhost:5000    chrome
    Maximize Browser Window

Kirjaudu Testudoon
    Input Text    id=inputUser    Admin
    Input Text    id=inputPassword    %{TESTUDO_ADMIN_PASSWORD}
    click button    id=submit-button
    sleep      1s

Valitse Home välilehti
    Click Link       //*[@id="root"]/div/div[1]/nav/div/ul/li[2]/a
    sleep    1s


