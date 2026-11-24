# -*- coding: utf-8 -*-
import pymupdf, glob
p=glob.glob(r"c:\Users\Lenovo\Desktop\关于六级\翻译\近五年*.pdf")[0]
d=pymupdf.open(p)
for pno in [5,12,13]:
    print("==== page",pno+1)
    for w in d[pno].get_text("words"):
        print(round(w[0]),round(w[1]),repr(w[4]))
