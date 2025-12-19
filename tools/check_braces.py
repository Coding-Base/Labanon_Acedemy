import sys
p=r'c:\Users\USER\Desktop\Lebanon Acedemy\frontend\src\pages\CreateCourse.tsx'
s=open(p,encoding='utf-8').read()
stack=[]
pairs={'(':')','{':'}','[':']'}
openers=set(pairs.keys())
closers=set(pairs.values())
for i,ch in enumerate(s,1):
    if ch in openers:
        stack.append((ch,i))
    elif ch in closers:
        if not stack:
            print('Unmatched closer',ch,'at',i)
            break
        last,li=stack.pop()
        if pairs[last]!=ch:
            print('Mismatched',last,'at',li,'with',ch,'at',i)
            break
else:
    if stack:
        print('Unmatched openers remain:', stack[:10])
    else:
        print('All braces/paren/brackets match')
