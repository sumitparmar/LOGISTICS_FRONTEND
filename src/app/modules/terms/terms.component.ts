import {
  Component,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

interface TermsPointBlock {
  heading: string;
  points: string[];
}

interface TermsSection {
  title: string;
  content: TermsPointBlock[];
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
})
export class TermsComponent implements AfterViewInit, OnDestroy {
  activeIndex: number | null = null;
  @ViewChildren('sectionRef') sectionsRef!: QueryList<ElementRef>;
  private isManualScroll = false;
  private scrollHandler!: () => void;
  toggle(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  sections: TermsSection[] = [
    {
      title: '1. Contractual Relationship',
      content: [
        {
          heading: '',
          points: [
            'These Terms govern your access and use of MoveKart services, including its website, applications, and platform.',
            'MoveKart acts as a technology intermediary connecting customers with independent delivery partners.',
            'MoveKart does not provide courier or logistics services directly.',
          ],
        },
      ],
    },

    {
      title: '2. Acceptance of Terms',
      content: [
        {
          heading: '',
          points: [
            'By accessing or using MoveKart services, you agree to be legally bound by these Terms.',
            'If you do not agree with any part of these Terms, you must discontinue use of the platform immediately.',
          ],
        },
      ],
    },

    {
      title: '3. Nature of Services',
      content: [
        {
          heading: '',
          points: [
            'MoveKart provides a digital platform that enables users to connect with independent delivery partners.',
            'All delivery services are performed by third-party providers and not by MoveKart.',
            'MoveKart is not responsible for execution, delays, or handling of goods.',
          ],
        },
      ],
    },

    {
      title: 'Part A – General Use of MoveKart Services',
      content: [
        {
          heading: 'Platform Nature',
          points: [
            'MoveKart operates as a technology platform that connects users with independent delivery partners.',
            'MoveKart does not provide courier, logistics, or transportation services directly.',
            'All delivery services are performed by third-party providers who are not employees of MoveKart.',
          ],
        },
        {
          heading: 'License to Use',
          points: [
            'MoveKart grants users a limited, non-exclusive, non-transferable license to access and use its platform.',
            'This license is strictly for personal or business use as permitted under these Terms.',
            'Users may not copy, distribute, or exploit any part of the platform without written permission.',
          ],
        },
        {
          heading: 'Restrictions',
          points: [
            'Users must not misuse the platform or attempt unauthorized access.',
            'Users must not interfere with the platform’s functionality or security systems.',
            'Use of automated systems, bots, or scraping tools is strictly prohibited.',
          ],
        },
        {
          heading: 'User Accounts',
          points: [
            'Users are responsible for maintaining the confidentiality of their account credentials.',
            'All activities performed through a user account are the responsibility of the account holder.',
            'MoveKart reserves the right to suspend or terminate accounts for suspicious or fraudulent activity.',
          ],
        },
        {
          heading: 'Service Availability',
          points: [
            'MoveKart does not guarantee uninterrupted availability of services.',
            'Access may be restricted due to maintenance, upgrades, or technical issues.',
            'MoveKart reserves the right to modify or discontinue services at any time without prior notice.',
          ],
        },
        {
          heading: 'Third-Party Services',
          points: [
            'The platform may include services provided by third parties.',
            'MoveKart is not responsible for the performance or reliability of third-party services.',
            'Users interact with third-party providers at their own risk.',
          ],
        },
        {
          heading: 'Payments',
          points: [
            'Service charges are calculated based on the information provided during booking.',
            'Users agree to pay all applicable fees associated with delivery requests.',
            'MoveKart may use third-party payment processors to handle transactions securely.',
          ],
        },
        {
          heading: 'Data Usage',
          points: [
            'MoveKart may collect and process user data in accordance with its Privacy Policy.',
            'User data may be shared with delivery partners to fulfill service requests.',
            'MoveKart implements reasonable measures to protect user information.',
          ],
        },
        {
          heading: 'Termination',
          points: [
            'MoveKart reserves the right to suspend or terminate access to the platform at its discretion.',
            'Termination may occur due to violation of Terms, misuse, or legal requirements.',
            'Users may discontinue use of services at any time.',
          ],
        },
      ],
    },

    {
      title: 'Part B – Delivery, Liability & Responsibilities',
      content: [
        {
          heading: 'Role of MoveKart',
          points: [
            'MoveKart acts solely as a technology platform that connects users with independent delivery partners.',
            'MoveKart does not undertake, control, or guarantee the execution of any delivery service.',
            'All delivery obligations are fulfilled by third-party delivery partners.',
          ],
        },
        {
          heading: 'Delivery Request Process',
          points: [
            'Users may place delivery requests through the MoveKart platform by providing accurate pickup and drop details.',
            'Delivery requests are matched with available delivery partners based on location and serviceability.',
            'MoveKart does not guarantee acceptance of any delivery request by a delivery partner.',
          ],
        },
        {
          heading: 'User Responsibilities',
          points: [
            'Users must provide complete and accurate information regarding shipment details, addresses, and contact information.',
            'Users are responsible for ensuring that the goods comply with all applicable laws and regulations.',
            'Users must not send prohibited, illegal, or hazardous items through the platform.',
          ],
        },
        {
          heading: 'Packaging & Handling',
          points: [
            'Users are responsible for proper packaging of goods to ensure safe transportation.',
            'MoveKart and delivery partners are not liable for damage caused due to inadequate packaging.',
            'Fragile or sensitive items must be clearly declared at the time of booking.',
          ],
        },
        {
          heading: 'Delivery Execution',
          points: [
            'Delivery partners are responsible for picking up and delivering goods to the specified destination.',
            'Estimated delivery times are indicative and may vary due to external factors.',
            'Delays may occur due to traffic, weather, operational issues, or unforeseen circumstances.',
          ],
        },
        {
          heading: 'Liability Limitation',
          points: [
            'MoveKart shall not be held liable for any loss, damage, or delay of goods during delivery.',
            'Any disputes regarding delivery must be resolved directly between the user and the delivery partner.',
            'MoveKart’s liability, if any, is limited to the extent permitted under applicable law.',
          ],
        },
        {
          heading: 'Prohibited Items',
          points: [
            'Users must not send illegal, hazardous, perishable (unless allowed), or restricted items.',
            'MoveKart reserves the right to cancel delivery requests involving prohibited goods.',
            'Users are solely responsible for any legal consequences arising from prohibited shipments.',
          ],
        },
        {
          heading: 'Cancellation Policy',
          points: [
            'Users may cancel a delivery request before it is accepted by a delivery partner without charges.',
            'Cancellation after acceptance may attract applicable cancellation fees.',
            'MoveKart reserves the right to cancel any delivery request at its discretion.',
          ],
        },
        {
          heading: 'Failed Deliveries',
          points: [
            'A delivery may be marked as failed if the recipient is unavailable or unreachable.',
            'Additional charges may apply for re-attempted deliveries.',
            'Users are responsible for ensuring recipient availability at the time of delivery.',
          ],
        },
        {
          heading: 'Cash on Delivery (COD)',
          points: [
            'COD services, if enabled, are facilitated by delivery partners.',
            'MoveKart does not guarantee collection or remittance of COD amounts.',
            'Users assume all risks associated with COD transactions.',
          ],
        },
        {
          heading: 'Disputes & Claims',
          points: [
            'Users must raise any complaints or claims within a reasonable timeframe.',
            'MoveKart may assist in dispute resolution but is not obligated to provide compensation.',
            'Final liability rests with the delivery partner as per applicable agreements.',
          ],
        },
      ],
    },

    {
      title: 'Part C – Delivery Partner (Courier) Terms',
      content: [
        {
          heading: 'Independent Contractor Status',
          points: [
            'All delivery partners on MoveKart operate as independent contractors and are not employees, agents, or representatives of MoveKart.',
            'Delivery partners are solely responsible for executing delivery services accepted through the platform.',
            'MoveKart does not control or supervise the actions of delivery partners during delivery operations.',
          ],
        },
        {
          heading: 'Acceptance of Delivery Requests',
          points: [
            'Delivery partners may accept or reject delivery requests at their discretion.',
            'Once a delivery request is accepted, the partner is responsible for completing the delivery as per agreed terms.',
            'Failure to fulfill accepted requests may lead to penalties or account restrictions.',
          ],
        },
        {
          heading: 'Electronic Records & Proof',
          points: [
            'Delivery partners agree to the use of electronic records for delivery tracking and confirmation.',
            'Digital confirmations, app-based acknowledgements, or recipient signatures serve as valid proof of delivery.',
            'These electronic records are legally binding and equivalent to physical documentation.',
          ],
        },
        {
          heading: 'Accuracy of Delivery Information',
          points: [
            'Delivery partners must ensure that the goods collected match the details provided in the delivery request.',
            'Any discrepancy must be reported before initiating delivery.',
            'Failure to verify details may result in liability for incorrect deliveries.',
          ],
        },
        {
          heading: 'Delivery Execution Standards',
          points: [
            'Delivery partners are expected to handle goods with care and follow professional service standards.',
            'Timely delivery and proper communication with users are required.',
            'Repeated service failures may result in suspension from the platform.',
          ],
        },
        {
          heading: 'Handling of Goods',
          points: [
            'Delivery partners must not tamper with, open, or misuse the goods during transit.',
            'Partners must refuse delivery of prohibited or suspicious items.',
            'Partners are responsible for maintaining safety and integrity of goods during transportation.',
          ],
        },
        {
          heading: 'Cash on Delivery (COD) Handling',
          points: [
            'Delivery partners are responsible for collecting COD payments where applicable.',
            'Collected amounts must be handled securely and remitted as per platform guidelines.',
            'MoveKart is not responsible for any discrepancies in COD collection by delivery partners.',
          ],
        },
        {
          heading: 'Compliance with Laws',
          points: [
            'Delivery partners must comply with all applicable local, state, and national laws.',
            'Partners are responsible for maintaining valid licenses, permits, and documentation required for delivery services.',
            'Any legal violation by the partner is solely their responsibility.',
          ],
        },
        {
          heading: 'Account Suspension & Termination',
          points: [
            'MoveKart reserves the right to suspend or terminate delivery partner accounts for misconduct, fraud, or policy violations.',
            'Repeated complaints or failure to meet service standards may result in permanent removal from the platform.',
            'MoveKart may take action without prior notice in critical situations.',
          ],
        },
      ],
    },

    {
      title: 'Part D – Platform & Site Terms',
      content: [
        {
          heading: 'Access to Platform',
          points: [
            'MoveKart services are accessible via web and mobile platforms subject to availability.',
            'Access may be limited or restricted in certain geographic regions or due to technical constraints.',
            'MoveKart does not guarantee continuous or uninterrupted access to its platform.',
          ],
        },
        {
          heading: 'Service Availability',
          points: [
            'MoveKart makes reasonable efforts to ensure platform availability and functionality.',
            'However, the platform may be temporarily unavailable due to maintenance, upgrades, or technical issues.',
            'MoveKart shall not be liable for any disruption or downtime.',
          ],
        },
        {
          heading: 'Platform Modifications',
          points: [
            'MoveKart reserves the right to modify, update, or discontinue any part of the platform at any time.',
            'Changes may be made without prior notice to users.',
            'Continued use of the platform after updates constitutes acceptance of such changes.',
          ],
        },
        {
          heading: 'User Conduct',
          points: [
            'Users must not misuse the platform or engage in activities that harm system integrity.',
            'Fraudulent activities, abuse, or manipulation of the platform are strictly prohibited.',
            'MoveKart reserves the right to take action against users violating platform rules.',
          ],
        },
        {
          heading: 'Account Suspension',
          points: [
            'MoveKart may suspend or restrict access to user accounts in case of suspected fraud or policy violations.',
            'Accounts may also be suspended for repeated complaints, misuse, or abnormal activity.',
            'MoveKart retains sole discretion in determining account actions.',
          ],
        },
        {
          heading: 'Accuracy of Information',
          points: [
            'MoveKart strives to ensure that all platform information is accurate and up to date.',
            'However, errors, inaccuracies, or outdated information may occur.',
            'MoveKart does not guarantee completeness or reliability of displayed content.',
          ],
        },
        {
          heading: 'Third-Party Integrations',
          points: [
            'The platform may include integrations with third-party services or APIs.',
            'MoveKart is not responsible for the performance, availability, or reliability of such third-party services.',
            'Users interact with third-party integrations at their own risk.',
          ],
        },
      ],
    },

    {
      title: 'Part E – Payments, Legal & General Terms',
      content: [
        {
          heading: 'Service Charges & Payments',
          points: [
            'All service fees are calculated based on the delivery details provided at the time of booking.',
            'Users agree to pay all applicable charges including delivery fees, taxes, and additional charges if applicable.',
            'Payments may be processed through third-party payment gateways integrated with the platform.',
          ],
        },
        {
          heading: 'Payment Processing',
          points: [
            'MoveKart facilitates payment collection on behalf of delivery partners where applicable.',
            'Payments are considered complete only after successful processing through the payment system.',
            'MoveKart is not responsible for failures or delays caused by payment service providers.',
          ],
        },
        {
          heading: 'Refunds & Adjustments',
          points: [
            'Refunds, if applicable, are processed based on MoveKart’s refund policy.',
            'Refund eligibility depends on the nature of the issue and timing of the request.',
            'MoveKart reserves the right to approve or reject refund claims at its discretion.',
          ],
        },
        {
          heading: 'User Data & Privacy',
          points: [
            'MoveKart collects and processes user data in accordance with its Privacy Policy.',
            'User data may be shared with delivery partners for the purpose of fulfilling delivery requests.',
            'MoveKart implements reasonable security measures to protect user data.',
          ],
        },
        {
          heading: 'Confidentiality',
          points: [
            'Users agree not to misuse or disclose any confidential information obtained through the platform.',
            'MoveKart maintains confidentiality of user data subject to legal and operational requirements.',
            'Confidential information may be disclosed if required by law or regulatory authorities.',
          ],
        },
        {
          heading: 'Limitation of Liability',
          points: [
            'MoveKart shall not be liable for indirect, incidental, or consequential damages arising from use of the platform.',
            'Liability, if any, shall be limited to the extent permitted under applicable law.',
            'MoveKart is not responsible for actions or omissions of delivery partners.',
          ],
        },
        {
          heading: 'Indemnity',
          points: [
            'Users agree to indemnify and hold MoveKart harmless from any claims, damages, or losses arising from misuse of the platform.',
            'This includes violations of these Terms or applicable laws.',
            'Indemnity obligations survive termination of service usage.',
          ],
        },
        {
          heading: 'Termination',
          points: [
            'MoveKart may suspend or terminate user access at any time for violation of Terms or suspicious activity.',
            'Users may discontinue use of the platform at any time.',
            'Termination does not affect any outstanding obligations or liabilities.',
          ],
        },
        {
          heading: 'Governing Law',
          points: [
            'These Terms shall be governed by and interpreted in accordance with the laws of India.',
            'Any disputes shall be subject to the jurisdiction of courts located in the applicable service region.',
          ],
        },
        {
          heading: 'Amendments to Terms',
          points: [
            'MoveKart reserves the right to update or modify these Terms at any time.',
            'Users are encouraged to review the Terms periodically.',
            'Continued use of the platform constitutes acceptance of updated Terms.',
          ],
        },
      ],
    },

    {
      title: 'Part F – Special Conditions for Delivery Partners',
      content: [
        {
          heading: 'Acceptance of Conditions',
          points: [
            'By using the MoveKart platform, delivery partners agree to comply with all applicable terms and policies.',
            'These special conditions form an integral part of the overall Terms.',
            'Continued use of the platform constitutes acceptance of any updates or modifications.',
          ],
        },
        {
          heading: 'Eligibility & Registration',
          points: [
            'Delivery partners must meet eligibility criteria including valid identification, licenses, and documentation.',
            'Partners are responsible for maintaining accurate account information.',
            'MoveKart reserves the right to verify and approve partner registrations.',
          ],
        },
        {
          heading: 'Operational Responsibilities',
          points: [
            'Delivery partners must ensure timely pickup and delivery of goods.',
            'Partners are responsible for maintaining service quality and professionalism.',
            'Failure to meet service standards may result in penalties or account suspension.',
          ],
        },
        {
          heading: 'Compliance & Documentation',
          points: [
            'Partners must comply with all applicable transport, safety, and legal regulations.',
            'Valid documentation must be maintained and provided upon request.',
            'Non-compliance may result in immediate removal from the platform.',
          ],
        },
        {
          heading: 'Performance Monitoring',
          points: [
            'MoveKart may monitor delivery partner performance based on ratings, feedback, and completion rates.',
            'Consistent poor performance may lead to suspension or termination.',
            'Performance metrics may be used to improve service quality.',
          ],
        },
      ],
    },

    {
      title: 'Schedule I – Prohibited & Restricted Items',
      content: [
        {
          heading: 'Prohibited Items',
          points: [
            'Illegal goods, contraband, or items prohibited under applicable law.',
            'Hazardous materials, explosives, or flammable substances.',
            'Weapons, ammunition, or dangerous equipment.',
            'Perishable goods without proper packaging or declaration.',
          ],
        },
        {
          heading: 'Restricted Items',
          points: [
            'High-value goods without prior declaration.',
            'Fragile items requiring special handling.',
            'Items requiring regulatory approvals or permits.',
            'Any goods deemed unsafe by delivery partners.',
          ],
        },
      ],
    },

    {
      title: 'Schedule II – Pricing & Charges',
      content: [
        {
          heading: 'Pricing Structure',
          points: [
            'Delivery charges are calculated based on distance, weight, and service type.',
            'Additional charges may apply for urgent deliveries, waiting time, or special handling.',
            'All applicable taxes are included or added as per regulatory requirements.',
          ],
        },
        {
          heading: 'Billing & Payments',
          points: [
            'Users are billed based on completed delivery requests.',
            'Charges are processed through the platform’s payment system.',
            'Invoices or transaction details may be provided digitally.',
          ],
        },
      ],
    },

    {
      title: 'Schedule III – Service Agreements',
      content: [
        {
          heading: 'Platform Agreement',
          points: [
            'Defines the relationship between MoveKart and users accessing the platform.',
            'Covers usage rights, responsibilities, and limitations.',
            'Applies to all users of MoveKart services.',
          ],
        },
        {
          heading: 'Delivery Service Agreement',
          points: [
            'Defines the relationship between users and delivery partners.',
            'Covers execution of delivery, obligations, and service expectations.',
            'Applies once a delivery request is accepted by a partner.',
          ],
        },
      ],
    },
  ];

  scrollToSection(index: number) {
    const el = this.sectionsRef.toArray()[index];
    if (!el) return;

    this.isManualScroll = true;

    const offset = 120;
    const elementTop =
      el.nativeElement.getBoundingClientRect().top + window.scrollY;

    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    let targetScroll = elementTop - offset;

    // clamp scroll (prevent going beyond bottom)
    if (targetScroll > maxScroll) {
      targetScroll = maxScroll;
    }

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });

    this.activeIndex = index;

    setTimeout(() => {
      this.isManualScroll = false;
    }, 600);
  }

  initScrollTracking() {
    this.scrollHandler = () => {
      if (this.isManualScroll) return;

      const sections = this.sectionsRef.toArray();

      let currentIndex = -1;

      sections.forEach((section, index) => {
        const rect = section.nativeElement.getBoundingClientRect();

        if (rect.top >= 0 && rect.top <= 200) {
          currentIndex = index;
        }
      });

      if (currentIndex !== -1 && currentIndex !== this.activeIndex) {
        this.activeIndex = currentIndex;
      }
    };

    window.addEventListener('scroll', this.scrollHandler);
  }

  ngAfterViewInit() {
    this.initScrollTracking();
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
