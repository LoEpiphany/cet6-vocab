# -*- coding: utf-8 -*-
import fitz, glob
p=glob.glob(r"c:\Users\Lenovo\Desktop\关于六级\翻译\近五年*.pdf")[0]
d=fitz.open(p)
print("pages",len(d))
for pno in [0,1,2]:
    page=d[pno]
    print("==== page",pno+1,page.rect)
    for w in page.get_text("words")[:80]:
        print(round(w[0]),round(w[1]),repr(w[4]))
