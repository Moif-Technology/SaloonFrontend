package com.sunmi.peripheral.printer;

interface IInnerPrinterCallback {
    void onCheckSelfResult(boolean isConnected);
    void onPrintResult(int code, String msg);
}
