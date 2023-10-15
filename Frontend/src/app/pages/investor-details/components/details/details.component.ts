import {
  Document,
  IUploadDocumentResponse,
  UploadDocument,
} from './../../../../../models/investor';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {
  IDocumentResponse,
  InvestorDetail,
  ISettingResponse,
  Setting,
} from 'src/models/investor';
import { InvestorService } from 'src/services/investor.service';
import { MenuItem, MessageService, PrimeIcons } from 'primeng/api';
import { IGenericResponse } from 'src/models/genericModels';
import { FileUpload } from 'primeng/fileupload';
@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  @Input()
  investorDetail!: InvestorDetail;
  @Input() userid: string | null;
  setting!: Setting;
  documents: Array<Document> = [];
  items: MenuItem[] = [];
  selectedDocument: Document;
  showDocument: boolean = false;
  addNoteModal: any;
  documentTypesList: Array<UploadDocument> = [];
  selectedDocumentType: UploadDocument | null = null;
  visible: boolean;
  selectedFile: File | null = null;
  fileUploadLoading: boolean = false;
  @ViewChild('uploadFile') uploadFile: FileUpload;

  constructor(
    private InvestorService: InvestorService,
    public messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.getSettings();
    this.getDocuments();
    this.getUploadDocuments();
    this.items = [
      {
        label: 'Verify',
        icon: PrimeIcons.CHECK_CIRCLE,
        command: () => this.verifyDocument(true),
      },
      {
        label: 'Not Verify',
        icon: PrimeIcons.TIMES_CIRCLE,
        command: () => this.verifyDocument(false),
      },
    ];
  }

  onFileSelect(event: any) {
    this.selectedFile = event.currentFiles[0];
  }

  onClear() {
    this.selectedFile = null;
  }

  showDialog() {
    this.visible = true;
  }

  hideDialog() {
    this.uploadFile.clear();
    this.selectedDocumentType = null;
    this.selectedFile = null;
    this.visible = false;
  }

  uploadDocument() {
    if (this.selectedFile && this.selectedDocumentType) {
      this.fileUploadLoading = true;
      const formData = new FormData();
      formData.append('user_id', String(this.investorDetail.user.id));
      formData.append('type_id', String(this.selectedDocumentType.id));
      formData.append('file', this.selectedFile);
      this.InvestorService.uploadDocuments(formData).subscribe({
        next: (res: IGenericResponse) => {
          this.messageService.add({
            severity: 'success',
            summary: '',
            detail: res.message,
          });
          this.getDocuments();
          this.hideDialog();
          this.fileUploadLoading = false;
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Something went wrong',
            detail: err.error.message,
          });
          console.log(err.error.message);
          this.fileUploadLoading = false;
        },
      });
    }
  }
  getSettings() {
    this.InvestorService.fetchInvestorSettings(Number(this.userid)).subscribe({
      next: (res: ISettingResponse) => {
        this.setting = res.data;
        console.log('Setting Response:', res);
      },
      error: (err: any) => {
        console.error('Setting Error:', err);
      },
    });
  }
  getUploadDocuments() {
    this.InvestorService.fetchUploadDocuments().subscribe({
      next: (res: IUploadDocumentResponse) => {
        this.documentTypesList = res.data.document_types;
        console.log('Documents Types Response:', res);
      },
      error: (err: any) => {
        console.error('Documents Types Error:', err);
      },
    });
  }
  getDocuments() {
    this.InvestorService.fetchInvestorDocuments(Number(this.userid)).subscribe({
      next: (res: IDocumentResponse) => {
        this.documents = res.data.documents;
        console.log('Document Response:', res);
      },
      error: (err: any) => {
        console.error('Document Error:', err);
      },
    });
  }

  verifyDocument(valid: boolean) {
    var body = {
      document_id: this.selectedDocument.id,
      is_valid: valid,
    };

    this.InvestorService.verifyDocument(body).subscribe({
      next: (res: IGenericResponse) => {
        this.messageService.add({
          severity: 'success',
          summary: '',
          detail: res.message,
        });
        this.getDocuments();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong',
          detail: err.error.message,
        });
      },
    });
  }

  viewDocument(doc: Document) {
    this.selectedDocument = doc;
    if (this.selectedDocument.file.includes('.pdf')) {
      window.open(this.selectedDocument.file);
    } else {
      this.showDocument = true;
    }
  }
}
