#include <Windows.h>
#include "screen.h"

#include <iostream>

// Capture a given portion of the screen
CaptureWorker::CaptureWorker(AQRect rect, Napi::Function &cb) : Napi::AsyncWorker(cb), x(x), y(y), w(w), h(h)
{
  captureArea = rect;
  width = captureArea.size.width;
  height = captureArea.size.height;
}

// Capture the full screen
CaptureWorker::CaptureWorker(Napi::Function &cb) : Napi::AsyncWorker(cb)
{
  captureArea = AQMakeRect(
    0, 0,
    GetSystemMetrics(SM_CYSCREEN),
    GetSystemMetrics(SM_CXSCREEN)
  );
  width = captureArea.size.width;
  height = captureArea.size.height;
}

void CaptureWorker::Execute()
{
  HDC screen = GetDC(NULL);
  HDC target = CreateCompatibleDC(screen);
  HBITMAP bitmap = CreateCompatibleBitmap(screen, width, height);
  
  DeleteObject(SelectObject(target, bitmap));
  BitBlt(target, 0,0, width, height, screen, captureArea.origin.x, captureArea.origin.y, SRCCOPY);

  BITMAPINFOHEADER info = {0};
  info.biSize = sizeof(BITMAPINFOHEADER);
  info.biWidth = width;
  info.biHeight = -height;
  info.biPlanes = 1;
  info.biBitCount = 32;
  info.biCompression = BI_RGB;

  bytesPerPixel = info.biBitCount / 8;
  bytesPerRow = bytesPerPixel * width;
  buffer = new uint8_t[bytesPerRow * height];

  GetDIBits(target, bitmap, 0, height, buffer, (BITMAPINFO*)&info, DIB_RGB_COLORS);

  ReleaseDC(NULL, screen);
  DeleteObject(bitmap);
  DeleteDC(target);
};

void CaptureWorker::OnOK()
{
  Napi::Buffer<uint8_t> data = Napi::Buffer<uint8_t>::New(
      Env(),
      buffer,
      bytesPerRow * height,
      [](Napi::Env /*env*/, void *finalizeData) {
        delete[] static_cast<uint8_t *>(finalizeData);
      });

  Napi::Object imageData = Napi::Object::New(Env());
  imageData.Set("width", Napi::Number::New(Env(), width));
  imageData.Set("height", Napi::Number::New(Env(), height));
  imageData.Set("bytesPerRow", Napi::Number::New(Env(), bytesPerRow));
  imageData.Set("bytesPerPixel", Napi::Number::New(Env(), bytesPerPixel));
  imageData.Set("data", data);

  Callback().Call({imageData});
};
