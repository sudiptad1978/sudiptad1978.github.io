from pathlib import Path

OUT = Path('resume.pdf')
W, H = 595, 842
M = 48

pages = []

def esc(s):
    return s.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

def pdf_text(x, y, text, font='R', size=9, color=(0.12,0.16,0.15)):
    font_name = '/F2' if font == 'B' else '/F1'
    r,g,b = color
    return f"BT {font_name} {size} Tf {r:.3f} {g:.3f} {b:.3f} rg {x:.1f} {y:.1f} Td ({esc(text)}) Tj ET\n"

def line(x1, y1, x2, y2, color=(0.75,0.82,0.79), width=0.6):
    r,g,b=color
    return f"{r:.3f} {g:.3f} {b:.3f} RG {width} w {x1} {y1} m {x2} {y2} l S\n"

def rect(x, y, w, h, color=(0.12,0.55,0.38)):
    r,g,b=color
    return f"{r:.3f} {g:.3f} {b:.3f} rg {x} {y} {w} {h} re f\n"

def wrap(text, max_chars=93):
    words = text.split()
    lines=[]; cur=''
    for word in words:
        if len(cur) + len(word) + 1 > max_chars and cur:
            lines.append(cur); cur=word
        else:
            cur = word if not cur else cur+' '+word
    if cur: lines.append(cur)
    return lines

for page_num in range(1, 5):
    pages.append([])

def header(page, title, subtitle=None):
    c=pages[page-1]
    c.append(rect(M, 792, 30, 4))
    c.append(pdf_text(M, 760, 'SUDIPTA DUTTA', 'B', 24, (0.07,0.12,0.11)))
    c.append(pdf_text(M, 738, 'QUALITY ENGINEERING LEADER  /  QA MANAGER  /  TEST AUTOMATION ARCHITECT', 'B', 8, (0.12,0.55,0.38)))
    c.append(pdf_text(M, 720, 'Älvsjö / Stockholm, Sweden   |   +46 762265270   |   deep.sudipta@gmail.com', 'R', 8, (0.31,0.38,0.36)))
    c.append(pdf_text(M, 706, 'linkedin.com/in/duttasudipta', 'R', 8, (0.31,0.38,0.36)))
    c.append(line(M, 691, W-M, 691))
    c.append(pdf_text(M, 662, title.upper(), 'B', 12, (0.07,0.12,0.11)))
    if subtitle:
        c.append(pdf_text(M, 645, subtitle, 'R', 9, (0.35,0.42,0.40)))
    return 625 if subtitle else 635

def section(page, y, title):
    c=pages[page-1]
    c.append(pdf_text(M, y, title.upper(), 'B', 9, (0.12,0.55,0.38)))
    c.append(line(M, y-6, W-M, y-6, (0.75,0.82,0.79), .5))
    return y-26

def para(page, y, text, size=9, leading=14, max_chars=94, x=M, color=(0.22,0.28,0.27)):
    for item in wrap(text, max_chars):
        pages[page-1].append(pdf_text(x, y, item, 'R', size, color)); y -= leading
    return y

def bullet(page, y, text, leading=14):
    pages[page-1].append(pdf_text(M+4, y, '-', 'B', 9, (0.12,0.55,0.38)))
    return para(page, y, text, 8.6, leading, 87, M+16, (0.22,0.28,0.27))

def job(page, y, dates, company, role, location, description, bullets=None, tags=None, gap=18):
    c=pages[page-1]
    c.append(pdf_text(M, y, dates.upper(), 'B', 7.5, (0.12,0.55,0.38)))
    c.append(pdf_text(M+105, y, company, 'B', 13, (0.07,0.12,0.11)))
    c.append(pdf_text(M+105, y-15, role, 'B', 8.5, (0.31,0.38,0.36)))
    c.append(pdf_text(W-M-125, y, location, 'R', 7.5, (0.40,0.47,0.45)))
    y -= 31
    if description: y=para(page,y,description,8.7,13,89)
    if bullets:
        y-=2
        for b in bullets: y=bullet(page,y,b,13)
    if tags:
        y-=4
        c.append(pdf_text(M+16, y, ' / '.join(tags).upper(), 'B', 7, (0.12,0.55,0.38)))
        y-=11
    c.append(line(M, y-3, W-M, y-3, (0.86,0.89,0.87), .45))
    return y-gap

# Page 1
p=1; y=header(p,'Profile','Quality Engineering Leader with 21+ years in IT and 14+ years specialising in Software Quality Engineering.')
y=section(p,y,'Profile')
y=para(p,y,'A player-coach leader who combines strategic vision with hands-on technical execution, architecting robust automation frameworks that embed quality at scale. Proven expertise in enterprise-scale quality transformation, scalable QA strategy and cross-functional leadership.',9.2,15,90)
y-=5
y=para(p,y,'Value proposition: Build scalable QA teams and robust automation ecosystems that accelerate release velocity without compromising security or stability.',9.2,15,90,color=(0.12,0.55,0.38))
y-=8
y=section(p,y,'Core strengths')
strengths=[('QA management','Multicultural team leadership, vendor management, resource planning and KPI-aligned quality governance.'),('Automation architecture','Hybrid frameworks from scratch using Playwright, Selenium, Appium, Java and TypeScript.'),('Cloud and DevOps','AWS and Kubernetes environments, CI/CD quality gates and zero-downtime migration validation.'),('Security first','OAuth 2.0, OIDC, SCIM and OWASP-based security testing across the SDLC.'),('Quality strategy','Risk-based test strategy, shift-left practices, release governance and ROI-focused testing.')]
for name,desc in strengths:
    pages[p-1].append(pdf_text(M,y,name,'B',9.2,(0.07,0.12,0.11)))
    y=para(p,y-13,desc,8.7,13,76,x=M+12)
    y-=5
y=section(p,y,'Technology stack')
y=para(p,y,'Playwright  |  Selenium  |  Appium  |  Maestro  |  Java  |  Python  |  TypeScript  |  Jenkins  |  Docker  |  AWS  |  Kubernetes  |  REST Assured  |  Postman  |  Burp Suite  |  ZAP',9,15,85,color=(0.12,0.55,0.38))
y-=8
y=section(p,y,'Open to opportunities')
y=para(p,y,'QA Lead  |  QA Manager  |  Automation Specialist / Test Architect  |  Quality Engineering Lead',9,15,88)
y=para(p,y,'Sweden permanent resident. Open to hybrid or on-site roles.',8.8,14,94,color=(0.31,0.38,0.36))

# Page 2
p=2; y=header(p,'Professional experience','Selected leadership and engineering experience across streaming, identity, payments, retail, automotive and security.')
y=section(p,y,'Experience')
y=job(p,y,'June 2026 - Present','Nextory','Senior Test Automation Engineer','Stockholm, Sweden','Leading test architecture and quality engineering for Nextory\'s mobile streaming platform across iOS, Android and backend APIs.',[
    'Architected robust cross-platform automation suites to reduce regression cycle times for core app features.',
    'Integrated AI-driven workflows using Claude Code AI and Omni for script generation, edge-case coverage and root-cause analysis.',
    'Built end-to-end API suites for streaming, subscriptions and data synchronisation under high concurrency.',
    'Embedded automated checks into CI/CD pipelines and collaborated with product and engineering leads to improve testability.'
],['iOS / Android','AI-driven QA','API reliability'],gap=19)
y=job(p,y,'March 2025 - Present','Aparna','Founder and Principal QA Consultant','Lund, Sweden','A specialised Quality Engineering consultancy focused on QA strategy, automation and DevOps solutions.',[
    'Partner with organisations to move from legacy manual processes to automated, risk-based quality ecosystems.',
    'Deliver test strategy, programme leadership, Playwright and Selenium frameworks, CI/CD quality gates and OWASP analysis.',
    'Available for B2B consulting engagements and contract roles as a registered Swedish Enskild Firma.'
],['Consulting','Strategy','DevOps'],gap=19)
y=job(p,y,'March 2025 - April 2025','Schneider Electric Buildings AB','Senior Test Engineer','Lund, Sweden','Led the overhaul of the end-to-end test suite using TypeScript and Playwright, addressing Cloudflare Turnstile blocking issues and optimising OIDC / CIAM recovery workflows.',None,['Playwright','OIDC','Security'],gap=19)
y=job(p,y,'April 2020 - February 2025','Atea Sverige','Test Leader - Client: Axis Communications','Malmo / Lund, Sweden','Owned end-to-end quality governance for enterprise Identity and Access Management solutions supporting global secure deployments.',[
    'Designed a Dockerised Java, Selenium and REST API automation framework and integrated regression into Jenkins and GitHub Actions.',
    'Validated OAuth2, OIDC, SCIM and AWS migration paths across EC2, RDS, Lambda, DynamoDB and S3.',
    'Conducted OWASP security validation with ZAP and Burp Suite; mentored QA engineers and raised automation coverage to 80%+.'
],['Identity','AWS','80%+ coverage'],gap=0)

# Page 3
p=3; y=header(p,'Professional experience (continued)','')
y=section(p,y,'Experience')
y=job(p,y,'July 2019 - January 2020','Opera Software','QA Manager','Gothenburg, Sweden','Directed quality assurance for OPay, a high-growth omnichannel payment platform.',[
    'Defined a risk-based Master Test Strategy aligned with the roadmap and implemented a hybrid Java, Cucumber and Appium framework.',
    'Mentored QA engineers, coordinated resources and established release governance, defect triage and quality dashboards.',
    'Acted as the bridge between Product and Engineering to create Go / No-Go confidence for business-critical releases.'
],['Payments','Java','Appium'],gap=19)
y=job(p,y,'September 2018 - June 2019','Volvo Cars via PHTN Interactive Services','Senior QA Engineer','Gothenburg, Sweden','Led automation and validation for the CareByVolvo and Car Info customer platforms.',[
    'Designed a hybrid framework for responsive web, iOS and Android; strengthened regression stability across customer experiences.',
    'Conducted WCAG accessibility testing, A/B testing, analytics validation and real-device testing through BrowserStack.'
],['Automotive','Mobile','Accessibility'],gap=19)
y=job(p,y,'April 2016 - September 2018','Photon','Associate Manager QA - Client: Walgreens','Chennai Area, India','Led quality delivery for large-scale retail mobile and web applications.',[
    'Managed manual and automation teams, designed Selenium and Appium frameworks and defined release test strategies.',
    'Reduced manual regression effort by 60% and improved release stability across mobile platforms.'
],['Retail','Selenium','60% less manual effort'],gap=19)
y=job(p,y,'March 2011 - January 2016','RS Software','Assistant Technical Consultant - Client: Visa','India / San Mateo, USA','Led quality validation for mission-critical payment processing systems.',[
    'Designed scalable Selenium automation and directed functional, regression, performance and security testing.',
    'Validated batch processing and financial data integrity across AS/400 and z/Linux in high-availability environments.',
    'Acted as primary liaison between Visa stakeholders in California and the offshore QA team; created Bash utilities for migration datasets.'
],['Payments','Performance','Data integrity'],gap=19)
y=job(p,y,'May 2008 - April 2011','EMC / RSA','Engineering and Technical Support','Bengaluru, India','L3 / L4 support for RSA Adaptive Authentication and RSA Access Management products for Fortune 100 clients. Installation, integration and functional testing using SoapUI and Java.',None,['Security','Authentication','SoapUI'],gap=19)
y=job(p,y,'December 2006 - November 2006','BMC Software / Web Development Co. / SITE Soft','Technical Support Analyst / Software Developer','India','Technical support, application development, test case design, release debugging, knowledge base documentation and supply-chain web solutions.',None,['Support','Engineering'],gap=0)

# Page 4
p=4; y=header(p,'Career snapshot','A concise view of the leadership, technology and domain experience behind the work.')
y=section(p,y,'Career snapshot')
rows=[('Experience','21+ years in IT'),('Quality engineering','14+ years'),('Leadership','QA Lead, QA Manager, Test Leader, Principal Consultant'),('Automation','Playwright, Selenium, Appium, Maestro'),('Programming','Java, Python, TypeScript'),('Cloud and DevOps','AWS, Kubernetes, Jenkins, GitHub Actions, Docker'),('Security','OAuth 2.0, OIDC, SCIM, OWASP, ZAP, Burp Suite'),('Mobile','iOS, Android, real-device testing'),('API','REST APIs, REST Assured, Postman'),('Methodologies','Agile / Scrum, Risk-Based Testing, Shift-Left QA'),('Domains','Streaming, IAM, Payments, Retail, Automotive, Security')]
for key,val in rows:
    pages[p-1].append(pdf_text(M,y,key,'B',9,(0.07,0.12,0.11)))
    pages[p-1].append(pdf_text(M+142,y,val,'R',9,(0.22,0.28,0.27)))
    pages[p-1].append(line(M,y-7,W-M,y-7,(0.86,0.89,0.87),.4)); y-=24
y-=7
y=section(p,y,'Education')
pages[p-1].append(pdf_text(M,y,'1998 - 2002', 'B', 8, (0.12,0.55,0.38)))
pages[p-1].append(pdf_text(M+105,y,'The University of Burdwan', 'B', 12, (0.07,0.12,0.11)))
y-=16
pages[p-1].append(pdf_text(M+105,y,'B.E. - Computer Science', 'R', 9, (0.31,0.38,0.36)))
y-=31
pages[p-1].append(pdf_text(M,y,'1995 - 1997', 'B', 8, (0.12,0.55,0.38)))
pages[p-1].append(pdf_text(M+105,y,'Burdwan Municipal High School', 'B', 12, (0.07,0.12,0.11)))
y-=16
pages[p-1].append(pdf_text(M+105,y,'XII - 10+2', 'R', 9, (0.31,0.38,0.36)))
y-=43
y=section(p,y,'Languages')
y=para(p,y,'English - Full Professional    |    Bengali - Native or Bilingual    |    Hindi - Native or Bilingual',9,15,86)
y-=11
y=section(p,y,'Contact')
y=para(p,y,'Sudipta Dutta  |  Quality Engineering Leader, QA Manager, Test Automation Architect',10,16,85)
y=para(p,y,'Sweden  |  +46 762265270  |  deep.sudipta@gmail.com  |  linkedin.com/in/duttasudipta',9,15,86,color=(0.12,0.55,0.38))

# Add page footer to every page
for i, content in enumerate(pages, 1):
    content.append(line(M, 38, W-M, 38, (0.75,0.82,0.79), .5))
    content.append(pdf_text(M, 24, 'SUDIPTA DUTTA  /  PORTFOLIO RESUME', 'B', 7, (0.40,0.47,0.45)))
    content.append(pdf_text(W-M-45, 24, f'{i} / {len(pages)}', 'R', 7, (0.40,0.47,0.45)))

# Assemble PDF objects.
objects=[]
objects.append('<< /Type /Catalog /Pages 2 0 R >>')
page_obj_ids=[]
for i in range(len(pages)):
    page_obj_ids.append(3 + i*2)
Kids=' '.join(f'{n} 0 R' for n in page_obj_ids)
objects.append(f'<< /Type /Pages /Kids [{Kids}] /Count {len(pages)} >>')
for i, content in enumerate(pages):
    page_id=3+i*2; content_id=4+i*2
    stream=''.join(content)
    objects.append(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /F1 {3+len(pages)*2} 0 R /F2 {4+len(pages)*2} 0 R >> >> /Contents {content_id} 0 R >>')
    encoded=stream.encode('latin-1')
    objects.append(f'<< /Length {len(encoded)} >>\nstream\n{stream}endstream')
regular_id=3+len(pages)*2
bold_id=regular_id+1
objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')

pdf=b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
offsets=[0]
for idx,obj in enumerate(objects,1):
    offsets.append(len(pdf))
    pdf += f'{idx} 0 obj\n'.encode('latin-1') + obj.encode('latin-1') + b'\nendobj\n'
xref=len(pdf)
pdf += f'xref\n0 {len(objects)+1}\n'.encode('latin-1')
pdf += b'0000000000 65535 f \n'
for off in offsets[1:]: pdf += f'{off:010d} 00000 n \n'.encode('latin-1')
pdf += f'trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode('latin-1')
OUT.write_bytes(pdf)
print(f'Wrote {OUT} ({len(pdf)} bytes)')
