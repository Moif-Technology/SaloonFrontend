package com.sunmi.peripheral.printer;

interface IInnerPrinterService {
    void printerSelfChecking(in IInnerPrinterCallback callback);
    void getPrinterStatus(in IInnerPrinterCallback callback);
    void printText(String text, in IInnerPrinterCallback callback);
    void printBitmap(in android.graphics.Bitmap bitmap, in IInnerPrinterCallback callback);
    void feedPaper(int lines);
}
