# -*- coding: utf-8 -*-
import pymupdf, glob
p=glob.glob(r"c:\Users\Lenovo\Desktop\关于六级\翻译\近五年*.pdf")[0]
d=pymupdf.open(p)
for pno in range(len(d)):
    t=d[pno].get_text()
    head=t.strip().split("\n")[:3]
    print(pno+1, " | ".join(head))
